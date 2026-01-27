import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { MeetingAnalysis } from '@/types'

export const maxDuration = 60 // Maximum function duration: 60 seconds for Vercel
export const runtime = 'nodejs' // Use Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const { transcript, analysis, userId, title } = await request.json()

    if (!transcript || !analysis || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate a title from the analysis if none provided
    const meetingTitle = title || generateMeetingTitle(analysis)

    // Save meeting to database - action_items will be stored in results for now
    const meetingData: any = {
      user_id: userId,
      title: meetingTitle,
      transcript,
      results: analysis,
      meeting_date: new Date().toISOString(),
    }

    // Try to add action_items column if it exists
    // This will work after migration is run
    const processedActionItems = analysis.actionItems?.map((item: any, index: number) => ({
      id: item.id || `ai-${Date.now()}-${index}`,
      task: item.task,
      owner: item.owner,
      deadline: item.deadline,
      priority: item.priority || 'medium',
      completed: item.completed || false
    })) || []

    // Only add action_items if we have them
    if (processedActionItems.length > 0) {
      meetingData.action_items = processedActionItems
    }

    const { data: meeting, error: meetingError } = await (supabaseAdmin as any)
      .from('meetings')
      .insert(meetingData)
      .select()
      .single()

    if (meetingError) {
      console.error('Error saving meeting:', meetingError)
      return NextResponse.json(
        { error: 'Failed to save meeting' },
        { status: 500 }
      )
    }

    // Note: Action items are now stored in the meetings table directly
    // in the action_items JSONB field, not in a separate table

    return NextResponse.json({
      success: true,
      meeting,
      message: 'Meeting saved successfully'
    })

  } catch (error) {
    console.error('Error in meetings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // First get meetings with their results
    // Note: action_items column may not exist yet, so we select * and handle it
    const { data: meetings, error } = await (supabaseAdmin as any)
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Process meetings to ensure action_items field is properly populated
    if (meetings) {
      meetings.forEach((meeting: any) => {
        // If action_items field is not populated, extract from results.actionItems
        if (!meeting.action_items || (Array.isArray(meeting.action_items) && meeting.action_items.length === 0)) {
          if (meeting.results?.actionItems && Array.isArray(meeting.results.actionItems)) {
            meeting.action_items = meeting.results.actionItems.map((item: any, index: number) => ({
              id: item.id || `${meeting.id}-${index}`,
              task: item.task,
              owner: item.owner,
              deadline: item.deadline,
              priority: item.priority || 'medium',
              completed: item.completed || false
            }))
          }
        }
        // Ensure action_items is always an array
        if (!Array.isArray(meeting.action_items)) {
          meeting.action_items = []
        }
      })
    }

    if (error) {
      console.error('Error fetching meetings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ meetings })

  } catch (error) {
    console.error('Error in meetings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateMeetingTitle(analysis: MeetingAnalysis): string {
  // Extract a meaningful title from the analysis
  const participants = analysis.participants || []
  const summary = analysis.summary || ''

  // Try to find company/client names from participants
  const clientCompany = participants.find(p => p.company && p.role?.toLowerCase().includes('client'))?.company

  if (clientCompany) {
    return `Meeting with ${clientCompany}`
  }

  // Use first few words of summary
  const summaryWords = summary.split(' ').slice(0, 4).join(' ')
  if (summaryWords) {
    return `${summaryWords}...`
  }

  // Fallback
  return `Meeting - ${new Date().toLocaleDateString()}`
}