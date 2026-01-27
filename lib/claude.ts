import Anthropic from '@anthropic-ai/sdk'
import { MeetingAnalysis } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const ANALYSIS_PROMPT = `You are an AI assistant that analyzes meeting transcripts. Extract the following in JSON format:

1. summary: A 2-3 sentence summary of the meeting
2. participants: Array of objects with participant details:
   - name: Person's full name (required)
   - title: Their job title if mentioned (e.g. "Project Manager", "CEO", "Developer")
   - role: Their role in the meeting (e.g. "Client", "Team Lead", "Presenter")
   - company: Their company if different from host company
3. actionItems: Array of objects with:
   - task: What needs to be done
   - owner: Person responsible (extract from transcript)
   - deadline: When it's due (extract or mark as "Not specified")
   - priority: "high", "medium", or "low" based on urgency
   - completed: false (default)
4. decisions: Array of strings - decisions that were made
5. keyDates: Array of objects with:
   - date: The date mentioned
   - event: What happens on that date
6. followUpEmails: Array of 0-2 complete, ready-to-send email objects based on meeting context and relevance.

FIRST, analyze the meeting to determine which emails are needed:
- Was this a CLIENT meeting? → Generate a client email if there are client action items or important updates to share
- Was this an INTERNAL meeting? → Generate an internal email if there are team action items or decisions to communicate
- Was this a MIXED meeting? → Consider generating both if each has distinct, relevant content
- Was this just an INFO session? → May not need any follow-up emails

Only generate emails that ADD VALUE. Do not generate emails just to have them.

Structure for each email:
{
  "type": "client_external" | "internal_team",
  "recipientName": "string (who this email is for - extract from transcript)",
  "subject": "string (clear, professional subject line)",
  "body": "string (the complete email body, formatted with line breaks)"
}

CRITICAL DIFFERENTIATION BETWEEN EMAIL TYPES:

CLIENT EMAIL (only if relevant):
- WHEN TO GENERATE: Only if there are client action items, deliverables, or decisions that affect the client
- CONTENT: Professional, focuses on client's concerns, deliverables, and next steps
- EXCLUDE: Internal concerns, team issues, budget worries, resource constraints
- TONE: Polished, confident, solution-oriented

INTERNAL EMAIL (only if relevant):
- WHEN TO GENERATE: Only if there are internal action items, concerns, or coordination needed
- CONTENT: Direct communication about real issues, risks, resource needs, internal deadlines
- INCLUDE: Honest assessment of challenges, scope concerns, timeline risks, resource needs
- TONE: Frank, strategic, problem-solving focused

QUALITY GUIDELINES:

1. RELEVANCE: Each email must have a clear purpose. No filler emails.

2. STRUCTURE: Follow this format:
   - Greeting (Hi [Name],)
   - Opening line (Thank them or reference the meeting)
   - Action items for recipient (if any) with deadlines
   - Action items for sender (if any) with deadlines
   - Key decisions or important context (if relevant)
   - Brief closing line
   - Sign-off and name

3. ACTION ITEMS:
   - Only include action items relevant to the recipient
   - Be specific with deadlines
   - Format as bullet points with "•" character
   - Client email: Only client's action items and what you'll deliver to them
   - Internal email: Team tasks, internal deadlines, preparation work

4. LENGTH: Keep it concise. Aim for under 150 words per email.

5. SENDER NAME: Extract from transcript. If unclear, use "[Your name]" as placeholder.

Example for a client meeting:
{
  "type": "client_external",
  "recipientName": "Sarah",
  "subject": "Action Items from Today's Meeting - Website Redesign",
  "body": "Hi Sarah,\\n\\nThanks for the productive meeting today! Here's a quick recap.\\n\\nAction items for you:\\n• Send e-commerce requirements (product count, payment processors) - Due: Wednesday\\n• Coordinate with Tom on wireframe review - Due: Feb 5-10\\n\\nAction items for me:\\n• Get dev team quote for e-commerce component - Due: Friday\\n• Deliver wireframes for review - Due: February 5\\n\\nLooking forward to our Monday check-in!\\n\\nBest,\\nJohn"
}

Example for an internal-only meeting (no client email needed):
{
  "type": "internal_team",
  "recipientName": "Team",
  "subject": "Sprint Planning Follow-up - Q1 Priorities",
  "body": "Hi Team,\\n\\nQuick follow-up from our sprint planning session.\\n\\nAction items:\\n• Alex: Set up CI/CD pipeline - Due: Thursday\\n• Maria: Complete API documentation - Due: End of sprint\\n• Dev team: Code review backlog before Friday standup\\n\\nKey decision: We're postponing the payment integration to Sprint 3 to focus on core features.\\n\\nLet's sync at Friday's standup on progress.\\n\\nThanks,\\n[Your name]"
}

IMPORTANT:
- You may generate 0 emails (if no follow-up needed)
- You may generate 1 email (if only client OR internal is relevant)
- You may generate 2 emails (if both have distinct, valuable content)
- Never force email generation - only create what's truly useful

Pay special attention to extracting detailed participant information including titles, roles, and company affiliations when mentioned in the transcript.

Return ONLY valid JSON, no markdown or additional text.`

export async function analyzeMeetingTranscript(transcript: string): Promise<MeetingAnalysis> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `${ANALYSIS_PROMPT}\n\nTranscript:\n${transcript}`
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Clean the response text to extract JSON
    let jsonText = content.text.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Additional cleanup for any stray markdown or text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const analysis = JSON.parse(jsonText) as MeetingAnalysis
    return analysis
  } catch (error) {
    console.error('Error analyzing transcript:', error)
    console.error('Raw response:', error instanceof SyntaxError ? 'JSON parse error' : error)

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('API_KEY')) {
        throw new Error('Analysis service is not configured. Please check your API keys.')
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Service is temporarily unavailable. Please try again later.')
      }
      if (error.message.includes('Invalid API Key')) {
        throw new Error('Analysis service authentication failed. Please contact support.')
      }
    }

    throw new Error('Failed to analyze transcript')
  }
}