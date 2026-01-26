'use client'

import { useState } from 'react'
import { FollowUpEmail } from '@/types'
import { EmailCard } from './EmailCard'

interface EmailSectionProps {
  emails: FollowUpEmail[]
  onEmailsUpdate?: (emails: FollowUpEmail[]) => void
}

export function EmailSection({ emails, onEmailsUpdate }: EmailSectionProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [localEmails, setLocalEmails] = useState(emails)

  if (!emails || emails.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900">📧 Follow-up Emails</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No follow-up emails needed for this meeting</p>
          <p className="text-sm mt-2">The AI determined that this meeting doesn't require email follow-ups</p>
        </div>
      </div>
    )
  }

  const getTabLabel = (email: FollowUpEmail) => {
    return email.type === 'client_external' ? 'Client Email' : 'Internal Team'
  }

  const handleEmailUpdate = (updatedEmail: FollowUpEmail, index: number) => {
    const newEmails = [...localEmails]
    newEmails[index] = updatedEmail
    setLocalEmails(newEmails)
    onEmailsUpdate?.(newEmails)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">📧 Follow-up Emails</h3>
        {localEmails.length === 1 && (
          <span className="text-sm text-gray-500">
            Only {localEmails[0].type === 'client_external' ? 'client' : 'internal'} email needed
          </span>
        )}
      </div>

      {/* Tabs - only show if more than one email */}
      {localEmails.length > 1 && (
        <div className="flex gap-2">
          {localEmails.map((email, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === index
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getTabLabel(email)}
            </button>
          ))}
        </div>
      )}

      {/* Active Email */}
      <EmailCard
        email={localEmails[activeTab]}
        onUpdate={(updated) => handleEmailUpdate(updated, activeTab)}
      />
    </div>
  )
}