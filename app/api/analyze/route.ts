import { NextRequest, NextResponse } from 'next/server'
import { analyzeMeetingTranscript } from '@/lib/claude'
import { AnalyzeRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()

    if (!body.transcript || !body.transcript.trim()) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    const analysis = await analyzeMeetingTranscript(body.transcript)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error in analyze API:', error)

    return NextResponse.json(
      { error: 'Failed to analyze transcript' },
      { status: 500 }
    )
  }
}