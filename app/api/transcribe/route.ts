import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, validateAudioFile } from '@/lib/whisper'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Validate the audio file
    const validation = validateAudioFile(audioFile)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Transcribe the audio using Whisper API
    const transcript = await transcribeAudio(audioFile)

    if (!transcript || transcript.trim() === '') {
      return NextResponse.json(
        { error: 'Failed to extract text from audio file' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      transcript: transcript.trim(),
      message: 'Audio transcribed successfully'
    })

  } catch (error) {
    console.error('Error in transcribe API:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      { error: `Transcription failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// Set max duration and max file size for the API route
export const maxDuration = 300 // 5 minutes
export const runtime = 'nodejs'