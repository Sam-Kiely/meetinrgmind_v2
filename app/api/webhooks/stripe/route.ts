import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.log(`❌ Webhook signature verification failed.`, err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('✅ Stripe webhook received:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Get customer email from session
        const customerEmail = session.customer_email || session.customer_details?.email

        if (customerEmail) {
          // Update user profile with Stripe customer ID and subscription
          const { error } = await (supabaseAdmin as any)
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              subscription_tier: getSubscriptionTier(session.mode, session.amount_total),
            })
            .eq('email', customerEmail)

          if (error) {
            console.error('Error updating user profile:', error)
          }
        }

        console.log('💰 Payment successful for:', customerEmail)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        // Get customer details
        const customer = await stripe.customers.retrieve(customerId)
        const customerEmail = (customer as any).email

        if (customerEmail) {
          const subscriptionTier = getSubscriptionTierFromPrice(subscription.items.data[0]?.price.id)

          const { error } = await (supabaseAdmin as any)
            .from('profiles')
            .update({
              subscription_tier: subscriptionTier,
              stripe_customer_id: customerId,
            })
            .eq('email', customerEmail)

          if (error) {
            console.error('Error updating subscription:', error)
          }
        }

        console.log('🔄 Subscription updated for:', customerEmail)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        // Get customer details
        const customer = await stripe.customers.retrieve(customerId)
        const customerEmail = (customer as any).email

        if (customerEmail) {
          const { error } = await (supabaseAdmin as any)
            .from('profiles')
            .update({
              subscription_tier: 'free',
            })
            .eq('email', customerEmail)

          if (error) {
            console.error('Error canceling subscription:', error)
          }
        }

        console.log('❌ Subscription canceled for:', customerEmail)
        break
      }

      default:
        console.log(`🤷‍♀️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

function getSubscriptionTier(mode: string, amount: number | null): string {
  if (mode === 'subscription') {
    if (amount === 900) return 'individual' // $9.00
    if (amount === 2900) return 'team' // $29.00
  }
  return 'free'
}

function getSubscriptionTierFromPrice(priceId: string | undefined): string {
  // You'll need to replace these with your actual Stripe price IDs
  const priceTiers: { [key: string]: string } = {
    'price_individual_monthly': 'individual',
    'price_team_monthly': 'team',
    // Add your actual price IDs here
  }

  return priceTiers[priceId || ''] || 'free'
}