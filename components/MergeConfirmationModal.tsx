'use client'

import { useState } from 'react'

interface SimilarParticipant {
  contact_id: string
  name: string
  similarity_score: number
}

interface MergeConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  newParticipant: {
    name: string
    title?: string
    role?: string
    company?: string
    email?: string
  }
  similarParticipants: SimilarParticipant[]
  onMerge: (selectedContactId: string) => void
  onCreateNew: () => void
}

export default function MergeConfirmationModal({
  isOpen,
  onClose,
  newParticipant,
  similarParticipants,
  onMerge,
  onCreateNew
}: MergeConfirmationModalProps) {
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleMerge = async () => {
    if (!selectedContactId) return
    setLoading(true)
    await onMerge(selectedContactId)
    setLoading(false)
    onClose()
  }

  const handleCreateNew = async () => {
    setLoading(true)
    await onCreateNew()
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Similar Contact Found
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                We found similar contacts in your participant bank. Would you like to merge with an existing contact or create a new one?
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">New Participant</h4>
              <div className="text-sm text-blue-800">
                <div className="font-medium">{newParticipant.name}</div>
                {newParticipant.title && <div>Title: {newParticipant.title}</div>}
                {newParticipant.role && <div>Role: {newParticipant.role}</div>}
                {newParticipant.company && <div>Company: {newParticipant.company}</div>}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-gray-900">Similar Contacts</h4>
            {similarParticipants.map((similar) => (
              <label
                key={similar.contact_id}
                className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="merge-option"
                  value={similar.contact_id}
                  checked={selectedContactId === similar.contact_id}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="mt-1 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{similar.name}</div>
                  <div className="text-sm text-gray-600">
                    {Math.round(similar.similarity_score * 100)}% match
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={handleCreateNew}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Create New Contact'}
            </button>
            <button
              onClick={handleMerge}
              disabled={!selectedContactId || loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Merge with Selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}