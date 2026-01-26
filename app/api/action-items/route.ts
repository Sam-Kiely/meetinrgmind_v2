import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { actionItemId, completed, userId } = await request.json()

    if (!actionItemId || completed === undefined || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the action item belongs to the user's meeting
    const { data: actionItem, error: fetchError } = await supabaseAdmin
      .from('action_items')
      .select(`
        *,
        meeting:meetings(user_id)
      `)
      .eq('id', actionItemId)
      .single()

    if (fetchError || !actionItem || actionItem.meeting.user_id !== userId) {
      return NextResponse.json(
        { error: 'Action item not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update the action item
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('action_items')
      .update({
        completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', actionItemId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating action item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update action item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      actionItem: updatedItem,
      message: completed ? 'Action item marked as completed' : 'Action item marked as incomplete'
    })

  } catch (error) {
    console.error('Error in action items API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actionItemId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!actionItemId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify the action item belongs to the user's meeting
    const { data: actionItem, error: fetchError } = await supabaseAdmin
      .from('action_items')
      .select(`
        *,
        meeting:meetings(user_id)
      `)
      .eq('id', actionItemId)
      .single()

    if (fetchError || !actionItem || actionItem.meeting.user_id !== userId) {
      return NextResponse.json(
        { error: 'Action item not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete the action item
    const { error: deleteError } = await supabaseAdmin
      .from('action_items')
      .delete()
      .eq('id', actionItemId)

    if (deleteError) {
      console.error('Error deleting action item:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete action item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Action item deleted successfully'
    })

  } catch (error) {
    console.error('Error in action items API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}