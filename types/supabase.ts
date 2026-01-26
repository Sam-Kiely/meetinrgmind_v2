export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          subscription_tier: 'free' | 'individual' | 'team'
          stripe_customer_id: string | null
          meetings_this_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          subscription_tier?: 'free' | 'individual' | 'team'
          stripe_customer_id?: string | null
          meetings_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          subscription_tier?: 'free' | 'individual' | 'team'
          stripe_customer_id?: string | null
          meetings_this_month?: number
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          user_id: string
          title: string | null
          transcript: string
          results: any
          meeting_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          transcript: string
          results: any
          meeting_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          transcript?: string
          results?: any
          meeting_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      action_items: {
        Row: {
          id: string
          meeting_id: string
          task: string
          owner: string
          deadline: string | null
          priority: 'high' | 'medium' | 'low'
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          task: string
          owner: string
          deadline?: string | null
          priority?: 'high' | 'medium' | 'low'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          task?: string
          owner?: string
          deadline?: string | null
          priority?: 'high' | 'medium' | 'low'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_owner_id: string
          member_email: string
          invited_at: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          team_owner_id: string
          member_email: string
          invited_at?: string
          joined_at?: string | null
        }
        Update: {
          id?: string
          team_owner_id?: string
          member_email?: string
          invited_at?: string
          joined_at?: string | null
        }
      }
    }
  }
}