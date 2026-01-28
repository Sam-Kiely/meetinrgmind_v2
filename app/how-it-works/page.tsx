export default function HowItWorksPage() {
  const steps = [
    {
      number: '1',
      title: 'Sign In and Upload',
      subtitle: 'Secure authentication and flexible input',
      description: 'Create your free account to get started with 3 complimentary extractions. Upload audio files up to 200MB or paste meeting transcripts directly. Our system supports all major audio formats and works with any meeting platform.',
      features: [
        'Secure user authentication required',
        'Audio files up to 200MB supported',
        'Text transcript input available',
        'Works with all meeting platforms',
        'Process meetings retroactively'
      ],
      image: ''
    },
    {
      number: '2',
      title: 'AI Analysis',
      subtitle: 'Advanced processing and extraction',
      description: 'Our Claude-powered AI analyzes your meeting content with enterprise-grade accuracy. The system automatically transcribes audio files, identifies participants, extracts action items, and categorizes decisions and key dates. Audio files and raw transcripts are immediately deleted after processing - we only store the extracted insights.',
      features: [
        'Automatic audio transcription',
        'Participant identification',
        'Action items with owners and deadlines',
        'Key decisions and outcomes',
        'Important dates and milestones',
        'Audio/transcripts deleted after processing'
      ],
      image: ''
    },
    {
      number: '3',
      title: 'Structured Output',
      subtitle: 'Professional results and follow-up',
      description: 'Receive comprehensive meeting summaries with professionally crafted follow-up emails for both external clients and internal teams. All results are saved to your dashboard with full search and export capabilities.',
      features: [
        'Client-facing email summaries',
        'Internal team action items',
        'Meeting dashboard with history',
        'Search and filter capabilities',
        'Export to various formats',
        'One-click email copying'
      ],
      image: ''
    }
  ]

  const benefits = [
    {
      icon: '',
      title: 'Save 30+ Minutes Per Meeting',
      description: 'Eliminate manual note-taking and follow-up drafting. Get comprehensive results in under 60 seconds.'
    },
    {
      icon: '',
      title: 'Never Miss Action Items',
      description: 'AI-powered analysis ensures every task, decision, and deadline is captured and properly assigned.'
    },
    {
      icon: '',
      title: 'Improve Team Accountability',
      description: 'Clear action items with owners and deadlines keep everyone aligned and productive.'
    },
    {
      icon: '',
      title: 'Zero Data Retention',
      description: 'Audio files and raw transcripts are deleted immediately after processing. We only store extracted insights, never your original content.'
    }
  ]

  const pricingTiers = [
    {
      name: 'Free Trial',
      extracts: '3 extracts',
      features: ['Full feature access', 'Audio + text support', 'Email generation', 'No credit card required']
    },
    {
      name: 'Individual',
      price: '$9/month',
      extracts: 'Unlimited extracts',
      features: ['Everything in free trial', 'Meeting dashboard', 'Export capabilities', 'Priority support']
    }
  ]

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How MeetingMind Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your meeting recordings into actionable insights with our AI-powered platform.
            Sign in, upload, and get professional results in seconds.
          </p>
        </div>

        <div className="space-y-20">
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
              <div className="flex-1 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{step.title}</h2>
                    <p className="text-lg text-gray-600">{step.subtitle}</p>
                  </div>
                </div>

                <p className="text-gray-700 text-lg leading-relaxed">
                  {step.description}
                </p>

                <ul className="space-y-3">
                  {step.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Step {step.number}</h3>
                    <p className="text-sm text-gray-600">
                      {step.number === '1' && 'Create account and upload your meeting content'}
                      {step.number === '2' && 'AI processes and extracts structured information'}
                      {step.number === '3' && 'Access results via dashboard and email summaries'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Overview */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 text-lg">
              Try free, then upgrade when you're ready for unlimited access
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                {tier.price && <p className="text-3xl font-bold text-blue-600 mb-2">{tier.price}</p>}
                <p className="text-lg text-gray-600 mb-6">{tier.extracts}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="mt-20 bg-gray-50 rounded-xl p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Security is Our Priority
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              MeetingMind is designed with privacy-first architecture. Your sensitive meeting content is never stored.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Immediate Deletion</h3>
              <p className="text-gray-600 text-sm">
                Audio files and raw transcripts are automatically deleted immediately after AI processing completes. We never store your original meeting content.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Only Insights Saved</h3>
              <p className="text-gray-600 text-sm">
                We only retain the extracted insights: summaries, action items, and key decisions. Your confidential discussions remain private.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Enterprise-Grade Security</h3>
              <p className="text-gray-600 text-sm">
                All data transmission is encrypted with TLS 1.3. Your extracted insights are stored securely with industry-standard encryption at rest.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Perfect for companies with strict data governance requirements. No audio or transcript retention means reduced compliance risk.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Teams Choose MeetingMind
            </h2>
            <p className="text-gray-600 text-lg">
              Trusted by professionals who value efficiency and accuracy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 bg-black rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Sign up today and transform your first 3 meetings for free
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/signup" className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              Start Free Trial
            </a>
            <a href="/pricing" className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-black transition-colors font-semibold">
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}