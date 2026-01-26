import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: meeting, error } = await supabaseAdmin
      .from('meetings')
      .select(`
        *,
        action_items:action_items(*)
      `)
      .eq('id', meetingId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching meeting:', error)
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ meeting })

  } catch (error) {
    console.error('Error in meeting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}