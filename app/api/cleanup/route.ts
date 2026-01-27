import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { deleteAudioFromStorage, deleteAudioChunks } from '@/lib/storage'

export const runtime = 'nodejs'
export const maxDuration = 60

// Clean up audio files older than 1 hour
export async function POST(request: NextRequest) {
  try {
    // Get auth header for cron job authentication
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // List all files in the audio-recordings bucket
    const { data: files, error } = await supabaseAdmin.storage
      .from('audio-recordings')
      .list('', {
        limit: 100,
        offset: 0,
      })

    if (error) throw error

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    let deletedCount = 0

    // Delete files older than 1 hour
    for (const file of files || []) {
      if (file.created_at && new Date(file.created_at) < oneHourAgo) {
        try {
          await deleteAudioFromStorage(file.name)
          deletedCount++
        } catch (err) {
          console.error(`Failed to delete ${file.name}:`, err)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old audio files`
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}

// Manual cleanup endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST with proper authorization to run cleanup'
  })
}