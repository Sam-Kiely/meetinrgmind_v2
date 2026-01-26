export default function PricingPage() {
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
      cta: 'Start Analyzing',
      popular: false
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
      cta: 'Start Free Trial',
      popular: true
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
      cta: 'Start Team Trial',
      popular: false
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
            Choose the plan that fits your meeting workflow. Start with pay-as-you-go or save with unlimited access.
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
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time. No long-term contracts.</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
                <p className="text-gray-600">Absolutely. We use enterprise-grade encryption and never store your meeting content permanently.</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 mb-2">What file formats do you support?</h3>
                <p className="text-gray-600">Currently text transcripts. Audio file support (MP3, MP4, WAV) coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}