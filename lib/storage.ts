import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME = 'audio-recordings'
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB for Whisper API
const CHUNK_SIZE = 20 * 1024 * 1024 // 20MB chunks to stay under limit

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export async function uploadAudioToStorage(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; path: string; chunks?: string[] }> {
  try {
    // Check if file needs chunking
    if (file.size > MAX_FILE_SIZE) {
      return await uploadAudioInChunks(file, userId, onProgress)
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${uuidv4()}.${fileExt}`

    // Upload to Supabase Storage with progress tracking
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onProgress) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: Math.round((progress.loaded / progress.total) * 100)
            })
          }
        }
      } as any)

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return { url: publicUrl, path: data.path }
  } catch (error) {
    console.error('Error uploading audio:', error)
    throw new Error('Failed to upload audio file')
  }
}

async function uploadAudioInChunks(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; path: string; chunks: string[] }> {
  const chunks: string[] = []
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  let uploadedBytes = 0

  // Split and upload chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const fileExt = file.name.split('.').pop()
    const chunkName = `${userId}/${uuidv4()}_chunk_${i}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(chunkName, chunk, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    chunks.push(data.path)
    uploadedBytes += chunk.size

    if (onProgress) {
      onProgress({
        loaded: uploadedBytes,
        total: file.size,
        percentage: Math.round((uploadedBytes / file.size) * 100)
      })
    }
  }

  // Return first chunk URL and all chunk paths
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(chunks[0])

  return {
    url: publicUrl,
    path: chunks[0],
    chunks
  }
}

export async function deleteAudioFromStorage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('Error deleting audio:', error)
    throw new Error('Failed to delete audio file')
  }
}

export async function deleteTemporaryAudio(url: string, chunks?: string[]): Promise<void> {
  // Delete audio files after transcription to save storage
  try {
    if (chunks && chunks.length > 0) {
      await deleteAudioChunks(chunks)
    } else if (url) {
      // Extract path from URL
      const urlParts = url.split('/storage/v1/object/public/audio-recordings/')
      if (urlParts[1]) {
        await deleteAudioFromStorage(urlParts[1])
      }
    }
  } catch (error) {
    // Don't throw - just log, as cleanup is not critical
    console.error('Failed to cleanup temporary audio:', error)
  }
}

export async function deleteAudioChunks(chunks: string[]): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(chunks)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting audio chunks:', error)
    throw new Error('Failed to delete audio chunks')
  }
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}