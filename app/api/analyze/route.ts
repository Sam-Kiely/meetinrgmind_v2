import { NextRequest, NextResponse } from 'next/server'
import { analyzeMeetingTranscript } from '@/lib/claude'
import { AnalyzeRequest } from '@/types'

export const maxDuration = 60 // Maximum function duration: 60 seconds for Vercel
export const runtime = 'nodejs' // Use Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()

    if (!body.transcript || !body.transcript.trim()) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Analysis service is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const analysis = await analyzeMeetingTranscript(body.transcript)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error in analyze API:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Failed to analyze transcript: ${errorMessage}` },
      { status: 500 }
    )
  }
}