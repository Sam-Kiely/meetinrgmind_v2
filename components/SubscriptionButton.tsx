'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'

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

      const { sessionId, url, error } = await response.json()

      if (error) {
        console.error('Error creating checkout session:', error)
        alert('Failed to start checkout. Please try again.')
        return
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        console.error('No checkout URL received')
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