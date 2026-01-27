import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
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

    const { transcript, participants, meetingId } = await request.json()

    if (!transcript || !participants) {
      return NextResponse.json(
        { error: 'Transcript and participants required' },
        { status: 400 }
      )
    }

    // Create a modified prompt that focuses only on email regeneration
    const emailOnlyPrompt = `
    You are regenerating follow-up emails based on updated participant information.

    UPDATED PARTICIPANTS:
    ${participants.map((p: any) => `- ${p.name} (${p.role || 'Role not specified'}, ${p.company || 'Company not specified'})`).join('\n')}

    Original Meeting Context:
    ${transcript}

    Generate ONLY the followUpEmails array with updated context based on the participant changes.
    Consider role and company changes when determining email recipients and content.

    Return ONLY a JSON object with a followUpEmails array. Example:
    {
      "followUpEmails": [
        {
          "type": "client_external",
          "recipientName": "Name",
          "subject": "Subject line",
          "body": "Email body"
        }
      ]
    }
    `

    // Use Claude to regenerate just the emails (much cheaper than full analysis)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Use cheaper model for email refresh
        max_tokens: 2048,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: emailOnlyPrompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error('Failed to regenerate emails')
    }

    const claudeResponse = await response.json()
    const content = claudeResponse.content[0].text
    const emailData = JSON.parse(content)

    // If meetingId provided, update the meeting in database
    if (meetingId) {
      // First, get the existing meeting to update its results
      const { data: meeting, error: fetchError } = await supabaseAdmin
        .from('meetings')
        .select('results')
        .eq('id', meetingId)
        .eq('user_id', user.id)
        .single() as { data: any, error: any }

      if (!fetchError && meeting) {
        // Update the results with new emails and participants
        const updatedResults = {
          ...meeting.results,
          followUpEmails: emailData.followUpEmails,
          participants: participants
        }

        await (supabaseAdmin as any)
          .from('meetings')
          .update({
            results: updatedResults,
            updated_at: new Date().toISOString()
          })
          .eq('id', meetingId)
          .eq('user_id', user.id)
      }
    }

    return NextResponse.json({
      success: true,
      emails: emailData.followUpEmails
    })

  } catch (error) {
    console.error('Error refreshing emails:', error)
    return NextResponse.json(
      { error: 'Failed to refresh emails' },
      { status: 500 }
    )
  }
}