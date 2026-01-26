export default function HowItWorksPage() {
  const steps = [
    {
      number: '1',
      title: 'Upload or Paste',
      subtitle: 'No bot needed, process meetings anytime',
      description: 'Simply paste your meeting transcript into MeetingMind or upload an audio file. No need to invite a bot to your meetings or remember to start recording.',
      features: [
        'Text transcript support',
        'Audio file upload (coming soon)',
        'Works with any meeting platform',
        'Process meetings retroactively'
      ],
      image: '📝'
    },
    {
      number: '2',
      title: 'AI Extracts Actions',
      subtitle: 'Who does what by when',
      description: 'Our advanced AI analyzes your meeting content and automatically identifies action items, decisions, key dates, and attendees with 95%+ accuracy.',
      features: [
        'Action items with owners and deadlines',
        'Key decisions made',
        'Important dates and milestones',
        'Attendee identification',
        'Priority classification'
      ],
      image: '🤖'
    },
    {
      number: '3',
      title: 'Get Follow-up Emails',
      subtitle: 'Auto-generated, ready to send',
      description: 'Receive professionally crafted follow-up emails for both external clients and internal team members. Edit as needed and send directly from your email client.',
      features: [
        'Client-facing email summaries',
        'Internal team updates',
        'Professional tone and format',
        'Customizable and editable',
        'Copy with one click'
      ],
      image: '📧'
    }
  ]

  const benefits = [
    {
      icon: '⚡',
      title: 'Save 30+ Minutes Per Meeting',
      description: 'Stop manually writing meeting notes and follow-ups. Get everything you need in 30 seconds.'
    },
    {
      icon: '🎯',
      title: 'Never Miss Action Items',
      description: 'AI catches what humans miss. Ensure every task is identified and assigned properly.'
    },
    {
      icon: '📈',
      title: 'Improve Team Accountability',
      description: 'Clear action items with owners and deadlines keep everyone on track.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your meeting data is processed securely and never stored permanently.'
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
            Transform your meeting chaos into clear action plans in three simple steps.
            No bots, no complex setup—just results.
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
                  <div className="text-8xl mb-4">{step.image}</div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Step {step.number}</h3>
                    <p className="text-sm text-gray-600">
                      {step.number === '1' && 'Paste transcript or upload audio file'}
                      {step.number === '2' && 'AI processes and extracts key information'}
                      {step.number === '3' && 'Receive formatted emails and action items'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Teams Love MeetingMind
            </h2>
            <p className="text-gray-600 text-lg">
              Join thousands of professionals who've transformed their meeting workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 bg-black rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Meetings?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Start extracting action items from your meetings in seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              Try Free Demo
            </button>
            <button className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-black transition-colors font-semibold">
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}