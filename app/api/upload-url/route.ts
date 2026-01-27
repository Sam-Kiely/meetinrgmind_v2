import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType } = await request.json()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user with the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Generate a unique file path
    const fileExt = fileName.split('.').pop()
    const filePath = `${user.id}/${uuidv4()}.${fileExt}`

    // Create a signed upload URL using admin client
    const { data, error } = await supabaseAdmin.storage
      .from('audio-recordings')
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Error creating upload URL:', error)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path: filePath,
      token: data.token
    })

  } catch (error) {
    console.error('Error in upload-url API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}