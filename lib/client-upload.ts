'use client'

import { supabase } from './supabase'

export async function uploadAudioDirectly(file: File): Promise<{ url: string; path: string }> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Please sign in to upload audio files')
  }

  // Get the user's session token for authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('No active session')
  }

  // Get signed upload URL from our API
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get upload URL')
  }

  const { uploadUrl, path, token } = await response.json()

  // Upload directly to Supabase Storage
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file
  })

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file')
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('audio-recordings')
    .getPublicUrl(path)

  return { url: publicUrl, path }
}

export async function transcribeFromUrl(url: string, path: string): Promise<string> {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioUrl: url,
      audioPath: path
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to transcribe audio')
  }

  const data = await response.json()
  return data.transcript
}