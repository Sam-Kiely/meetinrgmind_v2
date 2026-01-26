import { NextRequest, NextResponse } from 'next/server'
import { MeetingAnalysis } from '@/types'

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

    // Create meeting object
    const meeting = {
      id: `meeting_${Date.now()}`,
      user_id: userId,
      title: meetingTitle,
      transcript,
      results: analysis,
      meeting_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    // For demo purposes, we'll use localStorage via cookies
    // In a real app, this would be saved to a database
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

    // For demo purposes, return empty array
    // In a real app, this would fetch from a database
    const meetings: any[] = []

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