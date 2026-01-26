export interface ActionItem {
  id?: string
  task: string
  owner: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  completed?: boolean
}

export interface Decision {
  decision: string
}

export interface KeyDate {
  date: string
  event: string
}

export interface MeetingParticipant {
  name: string
  title?: string
  role?: string
  company?: string
}

// Simple email format - focused on ready-to-send emails
export interface FollowUpEmail {
  type: 'client_external' | 'internal_team'
  recipientName: string
  subject: string
  body: string
}

export interface MeetingAnalysis {
  summary: string
  participants: MeetingParticipant[]
  actionItems: ActionItem[]
  decisions: string[]
  keyDates: KeyDate[]
  followUpEmails: FollowUpEmail[]
}

export interface Meeting {
  id: string
  user_id: string
  transcript: string
  results: MeetingAnalysis
  created_at: string
}

export interface User {
  id: string
  email: string
  subscription_tier: 'free' | 'individual' | 'team'
  meetings_this_month: number
  created_at: string
}

export interface AnalyzeRequest {
  transcript: string
}

export interface AnalyzeResponse extends MeetingAnalysis {}

export type PriorityColors = {
  high: string
  medium: string
  low: string
}