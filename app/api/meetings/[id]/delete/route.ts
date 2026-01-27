import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get participant retention preferences from request body
    const { retainParticipants } = await request.json().catch(() => ({ retainParticipants: false }))

    // First, check if any participants would become orphaned
    const { data: participantsInMeeting } = await (supabaseAdmin as any)
      .from('meeting_participants')
      .select(`
        participant_contact_id,
        participant_name
      `)
      .eq('meeting_id', meetingId)

    const orphanedParticipants: string[] = []

    if (participantsInMeeting && participantsInMeeting.length > 0) {
      for (const participant of participantsInMeeting) {
        if (participant.participant_contact_id) {
          // Check if this is the only meeting for this participant
          const { count } = await (supabaseAdmin as any)
            .from('meeting_participants')
            .select('*', { count: 'exact', head: true })
            .eq('participant_contact_id', participant.participant_contact_id)

          if (count === 1) {
            orphanedParticipants.push(participant.participant_name)
          }
        }
      }
    }

    // If user wants to retain orphaned participants, mark them as manually retained
    if (retainParticipants && orphanedParticipants.length > 0) {
      for (const participant of participantsInMeeting) {
        if (participant.participant_contact_id && orphanedParticipants.includes(participant.participant_name)) {
          await (supabaseAdmin as any)
            .from('participant_contacts')
            .update({ manually_retained: true })
            .eq('id', participant.participant_contact_id)
        }
      }
    }

    // Delete the meeting (cascade will handle meeting_participants)
    const { error: deleteError } = await (supabaseAdmin as any)
      .from('meetings')
      .delete()
      .eq('id', meetingId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting meeting:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete meeting' },
        { status: 500 }
      )
    }

    // Clean up orphaned participants if not retaining
    if (!retainParticipants && orphanedParticipants.length > 0) {
      for (const participant of participantsInMeeting) {
        if (participant.participant_contact_id && orphanedParticipants.includes(participant.participant_name)) {
          await (supabaseAdmin as any)
            .from('participant_contacts')
            .delete()
            .eq('id', participant.participant_contact_id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      orphanedParticipants,
      retained: retainParticipants
    })

  } catch (error) {
    console.error('Error in meeting delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}