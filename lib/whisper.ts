import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Can be made dynamic based on user preference
      temperature: 0.1, // Lower temperature for more consistent transcription
    })

    return transcription.text
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw new Error('Failed to transcribe audio file')
  }
}

export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 25 * 1024 * 1024 // 25MB limit (Whisper API limit)
  const allowedTypes = [
    'audio/mpeg',      // mp3
    'audio/mp4',       // mp4, m4a
    'audio/x-m4a',     // m4a (Apple)
    'audio/m4a',       // m4a alternative
    'audio/wav',       // wav
    'audio/webm',      // webm
    'video/mp4',       // mp4 (video files with audio)
    'video/webm',      // webm (video files with audio)
    'audio/ogg',       // ogg
    'audio/flac',      // flac
  ]

  const allowedExtensions = ['.mp3', '.mp4', '.m4a', '.wav', '.webm', '.ogg', '.flac']

  if (!file) {
    return { isValid: false, error: 'No file provided' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 25MB' }
  }

  // Check by MIME type
  const hasAllowedType = allowedTypes.includes(file.type)

  // Also check by file extension (for M4A files which may have inconsistent MIME types)
  const hasAllowedExtension = allowedExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  )

  if (!hasAllowedType && !hasAllowedExtension) {
    return {
      isValid: false,
      error: 'Invalid file type. Supported formats: MP3, M4A, MP4, WAV, WEBM, OGG, FLAC'
    }
  }

  return { isValid: true }
}

export async function transcribeAudioFromUrl(url: string): Promise<string> {
  try {
    console.log('Starting transcription from URL:', url.substring(0, 100) + '...')

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MeetingMind/1.0'
      }
    })

    console.log('Fetch response status:', response.status, response.statusText)
    console.log('Content-Type:', response.headers.get('content-type'))
    console.log('Content-Length:', response.headers.get('content-length'))

    if (!response.ok) {
      console.error('Failed to fetch audio:', response.status, response.statusText)
      throw new Error(`Failed to fetch audio from URL: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log('Downloaded arrayBuffer size:', arrayBuffer.byteLength)

    // Fix MIME type for Whisper API compatibility
    let contentType = response.headers.get('content-type') || 'audio/mpeg'

    // Map problematic MIME types to Whisper-compatible ones
    const mimeTypeMap: { [key: string]: string } = {
      'audio/x-m4a': 'audio/m4a',
      'audio/x-mp4': 'audio/mp4',
      'video/mp4': 'audio/mp4',
      'video/webm': 'audio/webm'
    }

    const whisperCompatibleType = mimeTypeMap[contentType] || contentType
    console.log('Original MIME type:', contentType)
    console.log('Whisper-compatible MIME type:', whisperCompatibleType)

    const blob = new Blob([arrayBuffer], { type: whisperCompatibleType })

    // Use appropriate file extension based on MIME type
    const fileExtensions: { [key: string]: string } = {
      'audio/m4a': 'audio.m4a',
      'audio/mp4': 'audio.mp4',
      'audio/mpeg': 'audio.mp3',
      'audio/mp3': 'audio.mp3',
      'audio/wav': 'audio.wav',
      'audio/webm': 'audio.webm',
      'audio/ogg': 'audio.ogg',
      'audio/flac': 'audio.flac'
    }

    const fileName = fileExtensions[whisperCompatibleType] || 'audio.mp3'
    console.log('Using filename:', fileName)

    // Create File from Blob for Whisper API
    const file = new File([blob], fileName, { type: whisperCompatibleType })

    console.log('Created file for Whisper - Size:', file.size, 'Type:', file.type)

    // Validate file before sending to Whisper
    if (file.size === 0) {
      throw new Error('Downloaded audio file is empty')
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new Error('Audio file exceeds Whisper 25MB limit')
    }

    return await transcribeAudio(file)
  } catch (error) {
    console.error('Error transcribing audio from URL:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to transcribe audio from URL: ${error.message}`)
    }
    throw new Error('Failed to transcribe audio from URL: Unknown error')
  }
}

export async function transcribeAudioChunks(chunkPaths: string[]): Promise<string> {
  try {
    const transcripts: string[] = []

    // Import server-side function dynamically
    const { getSignedUrlServer } = await import('./storage-server')

    // Transcribe each chunk
    for (const chunkPath of chunkPaths) {
      const signedUrl = await getSignedUrlServer(chunkPath)
      const transcript = await transcribeAudioFromUrl(signedUrl)
      transcripts.push(transcript)
    }

    // Combine all transcripts
    return transcripts.join(' ')
  } catch (error) {
    console.error('Error transcribing audio chunks:', error)
    throw new Error('Failed to transcribe audio chunks')
  }
}

export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration)
    })
    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio metadata'))
    })
    audio.src = URL.createObjectURL(file)
  })
}