import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actionItems } = await request.json()
    const { id: meetingId } = await params

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user owns this meeting
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the meeting belongs to the user
    const { data: meeting, error: fetchError } = await supabaseAdmin
      .from('meetings')
      .select('user_id')
      .eq('id', meetingId)
      .single()

    if (fetchError || !meeting || meeting.user_id !== user.id) {
      return NextResponse.json({ error: 'Meeting not found or unauthorized' }, { status: 404 })
    }

    // Try to update action_items column first (if it exists)
    // If it fails, update the results field instead
    let updateError = null
    let data = null

    try {
      const updateResult = await supabaseAdmin
        .from('meetings')
        .update({
          action_items: actionItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)
        .select()

      data = updateResult.data
      updateError = updateResult.error
    } catch (err) {
      updateError = err
    }

    // If updating action_items failed (column doesn't exist), update results.actionItems
    if (updateError) {
      console.log('action_items column not available, updating results.actionItems')

      // Get current meeting to update results
      const { data: currentMeeting } = await supabaseAdmin
        .from('meetings')
        .select('results')
        .eq('id', meetingId)
        .single()

      if (currentMeeting) {
        const updatedResults = {
          ...currentMeeting.results,
          actionItems: actionItems
        }

        const { data: updateData, error: resultsError } = await supabaseAdmin
          .from('meetings')
          .update({
            results: updatedResults,
            updated_at: new Date().toISOString()
          })
          .eq('id', meetingId)
          .select()

        if (resultsError) {
          console.error('Error updating results.actionItems:', resultsError)
          return NextResponse.json({ error: 'Failed to update action items' }, { status: 500 })
        }
        data = updateData
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Action items updated successfully',
      data
    })
  } catch (error) {
    console.error('Error in action items API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}