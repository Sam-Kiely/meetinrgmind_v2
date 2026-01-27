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

    // Save meeting to database
    const { data: meeting, error: meetingError } = await (supabaseAdmin as any)
      .from('meetings')
      .insert({
        user_id: userId,
        title: meetingTitle,
        transcript,
        results: analysis,
        meeting_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (meetingError) {
      console.error('Error saving meeting:', meetingError)
      return NextResponse.json(
        { error: 'Failed to save meeting' },
        { status: 500 }
      )
    }

    // Save action items separately for better management
    if (analysis.actionItems?.length > 0) {
      const actionItemsData = analysis.actionItems.map((item: any) => ({
        meeting_id: meeting.id,
        task: item.task,
        owner: item.owner,
        deadline: item.deadline,
        priority: item.priority || 'medium',
        completed: item.completed || false,
      }))

      const { error: actionItemsError } = await (supabaseAdmin as any)
        .from('action_items')
        .insert(actionItemsData)

      if (actionItemsError) {
        console.error('Error saving action items:', actionItemsError)
        // Don't fail the request, but log the error
      }
    }

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
    const { data: meetings, error } = await (supabaseAdmin as any)
      .from('meetings')
      .select(`
        id,
        title,
        meeting_date,
        created_at,
        results,
        action_items
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && meetings) {
      // Process each meeting to ensure action_items are available
      meetings.forEach((meeting: any) => {
        // If action_items field is not populated, extract from results
        if (!meeting.action_items && meeting.results?.actionItems) {
          meeting.action_items = meeting.results.actionItems.map((item: any, index: number) => ({
            id: item.id || `${meeting.id}-${index}`,
            task: item.task,
            owner: item.owner,
            deadline: item.deadline,
            priority: item.priority || 'medium',
            completed: item.completed || false
          }))
        }
        // Ensure action_items is always an array
        if (!meeting.action_items) {
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