import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, transcribeAudioFromUrl, transcribeAudioChunks } from '@/lib/whisper'
import { uploadAudioToStorage, deleteTemporaryAudio } from '@/lib/storage'
import { validateAudioFile } from '@/lib/whisper'

export const maxDuration = 60 // Maximum function duration: 60 seconds for Vercel
export const runtime = 'nodejs' // Use Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const userId = formData.get('userId') as string
    const useStorage = formData.get('useStorage') === 'true'

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

    let transcript = ''

    // For files > 4MB, use Supabase Storage
    if (audioFile.size > 4 * 1024 * 1024 || useStorage) {
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID required for storage upload' },
          { status: 400 }
        )
      }

      // Upload to Supabase Storage
      const { url, chunks } = await uploadAudioToStorage(audioFile, userId)

      try {
        // Transcribe based on whether it was chunked
        if (chunks && chunks.length > 1) {
          transcript = await transcribeAudioChunks(chunks)
        } else {
          transcript = await transcribeAudioFromUrl(url)
        }
      } finally {
        // Clean up temporary audio files after transcription
        await deleteTemporaryAudio(url, chunks)
      }
    } else {
      // Small files can go directly to Whisper
      transcript = await transcribeAudio(audioFile)
    }

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