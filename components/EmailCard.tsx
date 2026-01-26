'use client'

import { useState } from 'react'
import { FollowUpEmail } from '@/types'

interface EmailCardProps {
  email: FollowUpEmail
  onUpdate?: (updated: FollowUpEmail) => void
}

export function EmailCard({ email, onUpdate }: EmailCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedBody, setEditedBody] = useState(email.body)
  const [editedSubject, setEditedSubject] = useState(email.subject)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const textToCopy = `Subject: ${editedSubject}\n\n${editedBody}`
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    onUpdate?.({ ...email, body: editedBody, subject: editedSubject })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedBody(email.body)
    setEditedSubject(email.subject)
    setIsEditing(false)
  }

  const emailTypeLabel = email.type === 'client_external' ? 'Client Email' : 'Internal Team'

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500">{emailTypeLabel}</span>
          <p className="font-medium text-gray-900">To: {email.recipientName}</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Edit
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isEditing ? (
          /* EDIT MODE */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm text-gray-900 bg-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* REVIEW MODE */
          <div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-700">Subject:</span> {editedSubject}
            </p>
            <div className="border-t pt-4">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {editedBody}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}