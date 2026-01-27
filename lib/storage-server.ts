// Server-side only storage utilities
import { supabaseAdmin } from './supabase-admin'

const BUCKET_NAME = 'audio-recordings'

export async function getSignedUrlServer(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    throw new Error('Failed to create signed URL')
  }

  return data.signedUrl
}

export async function deleteAudioFromStorageServer(path: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('Error deleting audio:', error)
    // Don't throw - cleanup is not critical
  }
}

export async function deleteAudioChunksServer(chunks: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(chunks)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting audio chunks:', error)
    // Don't throw - cleanup is not critical
  }
}