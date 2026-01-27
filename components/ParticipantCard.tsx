'use client'

import { useState } from 'react'
import { Participant } from '@/types'
import { createClient } from '@supabase/supabase-js'

interface ParticipantCardProps {
  participant: Participant
  onUpdate?: (updatedParticipant: Participant) => void
  onAddToContacts?: (participant: Participant) => void
  isInContacts?: boolean
}

export default function ParticipantCard({
  participant,
  onUpdate,
  onAddToContacts,
  isInContacts = false
}: ParticipantCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedParticipant, setEditedParticipant] = useState(participant)
  const [isSaving, setIsSaving] = useState(false)
  const [addedToContacts, setAddedToContacts] = useState(isInContacts)
  const [isAdding, setIsAdding] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    if (onUpdate) {
      await onUpdate(editedParticipant)
    }
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleCancel = () => {
    setEditedParticipant(participant)
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isEditing) {
    return (
      <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Name</label>
            <input
              type="text"
              value={editedParticipant.name}
              onChange={(e) => setEditedParticipant({ ...editedParticipant, name: e.target.value })}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">Title</label>
            <input
              type="text"
              value={editedParticipant.title || ''}
              onChange={(e) => setEditedParticipant({ ...editedParticipant, title: e.target.value })}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Project Manager"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">Role</label>
            <input
              type="text"
              value={editedParticipant.role || ''}
              onChange={(e) => setEditedParticipant({ ...editedParticipant, role: e.target.value })}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Client, Team Lead"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">Company</label>
            <input
              type="text"
              value={editedParticipant.company || ''}
              onChange={(e) => setEditedParticipant({ ...editedParticipant, company: e.target.value })}
              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Company name"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-medium text-sm">
            {getInitials(participant.name)}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{participant.name}</h4>

              {participant.title && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="text-xs text-gray-500">Title: </span>
                  {participant.title}
                </div>
              )}

              {participant.role && (
                <div className="text-sm text-gray-600">
                  <span className="text-xs text-gray-500">Role: </span>
                  {participant.role}
                </div>
              )}

              {participant.company && (
                <div className="text-sm text-blue-600">
                  <span className="text-xs text-gray-500">Company: </span>
                  {participant.company}
                </div>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Edit participant"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {onAddToContacts && !addedToContacts && (
                <button
                  onClick={async () => {
                    setIsAdding(true)
                    await onAddToContacts(participant)
                    setAddedToContacts(true)
                    setIsAdding(false)
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Add to contacts"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                </button>
              )}

              {addedToContacts && (
                <div className="p-1 text-green-600" title="In contacts">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}