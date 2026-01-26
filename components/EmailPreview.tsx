'use client'

import { useState } from 'react'
import { FollowUpEmail } from '@/types'

interface EmailPreviewProps {
  email: FollowUpEmail
  title: string
}

export default function EmailPreview({ email, title }: EmailPreviewProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    const emailText = `To: ${email.recipientName}\nSubject: ${email.subject}\n\n${email.body}`
    await navigator.clipboard.writeText(emailText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          {copied ? 'Copied!' : 'Copy Email'}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">To:</label>
          <input
            type="text"
            value={email.recipientName}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subject:</label>
          <input
            type="text"
            value={email.subject}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Body:</label>
          <textarea
            value={email.body}
            readOnly
            rows={8}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 resize-none text-gray-900"
          />
        </div>
      </div>
    </div>
  )
}