import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, transcribeAudioFromUrl, transcribeAudioChunks } from '@/lib/whisper'
import { uploadAudioToStorage, deleteTemporaryAudio } from '@/lib/storage'
import { getSignedUrlServer } from '@/lib/storage-server'
import { validateAudioFile } from '@/lib/whisper'

export const maxDuration = 60 // Maximum function duration: 60 seconds for Vercel
export const runtime = 'nodejs' // Use Node.js runtime

export async function POST(request: NextRequest) {
  try {
    // Check content type to determine request format
    const contentType = request.headers.get('content-type') || ''

    // Handle JSON requests (from URL-based transcription)
    if (contentType.includes('application/json')) {
      const { audioUrl, audioPath } = await request.json()

      if (!audioUrl || !audioPath) {
        return NextResponse.json(
          { error: 'Audio URL and path are required' },
          { status: 400 }
        )
      }

      try {
        console.log('Processing audio transcription request')
        console.log('Audio URL:', audioUrl?.substring(0, 100) + '...')
        console.log('Audio Path:', audioPath)

        // Get a signed URL using service role for secure access
        console.log('Creating signed URL for path:', audioPath)
        const signedUrl = await getSignedUrlServer(audioPath, 3600)
        console.log('Got signed URL for secure transcription:', signedUrl?.substring(0, 100) + '...')

        // Transcribe from the signed URL
        console.log('Starting transcription process')
        const transcript = await transcribeAudioFromUrl(signedUrl)
        console.log('Transcription completed, length:', transcript?.length)

        // Clean up the file after transcription
        console.log('Cleaning up temporary files')
        await deleteTemporaryAudio(audioUrl, [audioPath])

        return NextResponse.json({
          transcript: transcript.trim(),
          message: 'Audio transcribed successfully'
        })
      } catch (error) {
        console.error('Transcription error details:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          audioUrl: audioUrl?.substring(0, 100) + '...',
          audioPath: audioPath
        })

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
          { error: `Transcription failed: ${errorMessage}` },
          { status: 500 }
        )
      }
    }

    // Handle FormData requests (legacy/small files)
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