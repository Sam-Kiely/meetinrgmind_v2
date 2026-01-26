'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/lib/auth'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/auth/signin'
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_INDIVIDUAL_PRICE_ID || 'price_1StwjkHB1vF8ECVdL2bYYzeW',
          userId: user.id,
          userEmail: user.email,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        console.error('Error creating checkout session:', error)
        alert('Failed to start checkout. Please try again.')
        return
      }

      const stripe = await stripePromise
      if (!stripe) {
        console.error('Stripe failed to load')
        return
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        console.error('Error redirecting to checkout:', stripeError)
        alert('Failed to redirect to checkout. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className="w-full py-3 px-6 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Loading...' : 'Subscribe - $9/month'}
    </button>
  )
}