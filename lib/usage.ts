import { supabaseAdmin } from './supabase-admin'

const FREE_EXTRACT_LIMIT = 3

export interface UsageStatus {
  canExtract: boolean
  extractCount: number
  hasSubscription: boolean
  message?: string
}

export async function checkUserUsage(userId: string): Promise<UsageStatus> {
  try {
    // Get user's current usage
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('user_usage')
      .select('extract_count')
      .eq('user_id', userId)
      .maybeSingle()

    if (usageError) {
      console.error('Error fetching user usage:', usageError)
      throw new Error('Failed to check usage')
    }

    const extractCount = (usage as any)?.extract_count || 0

    // Check if user has subscription
    const { data: hasSubResult, error: subError } = await (supabaseAdmin as any)
      .rpc('user_has_subscription', { user_uuid: userId })

    if (subError) {
      console.error('Error checking subscription:', subError)
      // If we can't check subscription, assume no subscription but allow usage check
    }

    const hasSubscription = hasSubResult || false

    // Determine if user can extract
    if (hasSubscription) {
      return {
        canExtract: true,
        extractCount,
        hasSubscription: true,
        message: 'Unlimited extracts with subscription'
      }
    }

    if (extractCount < FREE_EXTRACT_LIMIT) {
      return {
        canExtract: true,
        extractCount,
        hasSubscription: false,
        message: `${FREE_EXTRACT_LIMIT - extractCount} free extracts remaining`
      }
    }

    return {
      canExtract: false,
      extractCount,
      hasSubscription: false,
      message: `You've used all ${FREE_EXTRACT_LIMIT} free extracts. Subscribe for unlimited access.`
    }

  } catch (error) {
    console.error('Error checking user usage:', error)
    throw new Error('Failed to verify usage limits')
  }
}

export async function incrementUserUsage(userId: string): Promise<number> {
  try {
    const { data: newCount, error } = await (supabaseAdmin as any)
      .rpc('increment_user_usage', { user_uuid: userId })

    if (error) {
      console.error('Error incrementing usage:', error)
      throw new Error('Failed to update usage count')
    }

    return newCount
  } catch (error) {
    console.error('Error incrementing user usage:', error)
    throw new Error('Failed to update usage count')
  }
}

export async function getUserUsageStats(userId: string): Promise<{
  extractCount: number
  hasSubscription: boolean
  remainingFreeExtracts: number
}> {
  const status = await checkUserUsage(userId)

  return {
    extractCount: status.extractCount,
    hasSubscription: status.hasSubscription,
    remainingFreeExtracts: Math.max(0, FREE_EXTRACT_LIMIT - status.extractCount)
  }
}