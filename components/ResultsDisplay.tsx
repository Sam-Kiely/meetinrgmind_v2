import { MeetingAnalysis } from '@/types'
import ActionItemCard from './ActionItemCard'
import { EmailSection } from './EmailSection'

interface ResultsDisplayProps {
  analysis: MeetingAnalysis
}

export default function ResultsDisplay({ analysis }: ResultsDisplayProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Meeting Analysis Complete</h2>
        <p className="text-gray-600">Here's what we extracted from your meeting</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Meeting Summary</h3>
        <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">👥 Meeting Participants</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.participants.map((participant, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="font-semibold text-gray-900">{participant.name}</h4>
                  {participant.title && (
                    <p className="text-sm text-gray-600">{participant.title}</p>
                  )}
                  {participant.role && (
                    <p className="text-xs text-gray-500">{participant.role}</p>
                  )}
                  {participant.company && (
                    <p className="text-xs text-blue-600">{participant.company}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">✅ Action Items</h3>
        <div className="space-y-4">
          {analysis.actionItems.map((item, index) => (
            <ActionItemCard key={index} actionItem={item} />
          ))}
        </div>
      </div>

      {analysis.decisions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🎯 Decisions Made</h3>
          <ul className="space-y-3">
            {analysis.decisions.map((decision, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700">{decision}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.keyDates.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📅 Key Dates</h3>
          <div className="space-y-3">
            {analysis.keyDates.map((keyDate, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{keyDate.event}</span>
                <span className="text-gray-600">{keyDate.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Always show email section - it will handle empty state */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <EmailSection emails={analysis.followUpEmails || []} />
      </div>
    </div>
  )
}