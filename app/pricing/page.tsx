'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function PricingPage() {
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

  const plans = [
    {
      name: 'Pay As You Go',
      price: '$0.50',
      period: '/meeting',
      description: 'Perfect for occasional users',
      features: [
        'Process individual meetings',
        'All AI analysis features',
        'Email generation',
        'No subscription required'
      ],
      cta: 'Coming Soon',
      action: null,
      popular: false,
      disabled: true
    },
    {
      name: 'Individual',
      price: '$9',
      period: '/month',
      description: 'Best for regular meeting participants',
      features: [
        'Unlimited meetings',
        'All AI analysis features',
        'Email generation',
        'Meeting history',
        'Priority support'
      ],
      cta: 'Subscribe Now',
      action: handleSubscribe,
      popular: true,
      disabled: false
    },
    {
      name: 'Team',
      price: '$29',
      period: '/month',
      description: 'For teams up to 10 members',
      features: [
        'Everything in Individual',
        'Up to 10 team members',
        'Shared meeting library',
        'Team analytics',
        'Admin dashboard',
        'Priority support'
      ],
      cta: 'Coming Soon',
      action: null,
      popular: false,
      disabled: true
    }
  ]

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your meeting workflow. Start with our Individual plan for unlimited meeting analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-8 relative ${
                plan.popular ? 'ring-2 ring-black scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {plan.price}
                  <span className="text-lg font-normal text-gray-600">{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.action || undefined}
                disabled={plan.disabled || isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-black text-white hover:bg-gray-800'
                    : plan.disabled
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading && !plan.disabled ? 'Loading...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}