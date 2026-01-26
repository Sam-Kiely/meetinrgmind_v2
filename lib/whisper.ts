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