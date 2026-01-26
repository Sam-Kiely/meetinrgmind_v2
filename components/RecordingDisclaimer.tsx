'use client'

import { useState } from 'react'

interface RecordingDisclaimerProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export function RecordingDisclaimer({ isOpen, onClose, onAccept }: RecordingDisclaimerProps) {
  const [isChecked, setIsChecked] = useState(false)

  if (!isOpen) return null

  const onePartyStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'Colorado', 'District of Columbia',
    'Georgia', 'Hawaii', 'Idaho', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Nebraska', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
    'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
    'Vermont', 'Virginia', 'West Virginia', 'Wisconsin', 'Wyoming'
  ]

  const allPartyStates = [
    'California', 'Connecticut', 'Delaware', 'Florida', 'Illinois', 'Maryland',
    'Massachusetts', 'Montana', 'Nevada', 'New Hampshire', 'Pennsylvania', 'Washington'
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📞 Phone Call Recording Laws</h2>
            <p className="text-gray-600">
              Before uploading recorded phone calls, please understand the recording consent laws that may apply to you.
            </p>
          </div>

          {/* One-Party Consent States */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">✅ One-Party Consent (38 States + DC)</h3>
            <p className="text-sm text-gray-600 mb-3">
              In these states, only ONE person on the call needs to know it's being recorded (that's you).
              You can legally record without telling the other party.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-800">
                {onePartyStates.join(', ')}
              </p>
            </div>
          </div>

          {/* All-Party Consent States */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">⚠️ All-Party Consent (12 States)</h3>
            <p className="text-sm text-gray-600 mb-3">
              In these states, ALL parties on the call must consent to being recorded.
              Recording without consent may be illegal.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-800">
                {allPartyStates.join(', ')}
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">📝 Important Notes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• If you're in a one-party state but the OTHER person is in an all-party state, the stricter law typically applies</li>
              <li>• Business calls may have different rules than personal calls</li>
              <li>• When in doubt, simply ask: "Do you mind if I record this call for my notes?"</li>
              <li>• This is general information, not legal advice. Consult an attorney for specific situations.</li>
            </ul>
          </div>

          {/* Best Practice */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Best Practice</h3>
            <p className="text-sm text-blue-800">
              The safest approach: At the start of any call you want to record, simply say
              <strong> "Do you mind if I record this for my notes?"</strong> Most people say yes,
              and you're legally covered everywhere.
            </p>
          </div>

          {/* Checkbox */}
          <div className="mb-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                I understand that I am responsible for complying with applicable recording consent laws in my jurisdiction
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={!isChecked}
              className={`flex-1 px-4 py-3 rounded-lg font-medium ${
                isChecked
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}