'use client'

import { useState, useEffect } from 'react'
import { MeetingAnalysis, Participant } from '@/types'
import ActionItemCard from './ActionItemCard'
import { EmailSection } from './EmailSection'
import ParticipantCard from './ParticipantCard'
import MergeConfirmationModal from './MergeConfirmationModal'
import { supabase } from '@/lib/supabase'

interface SimilarParticipant {
  contact_id: string
  name: string
  similarity_score: number
}

interface ResultsDisplayProps {
  analysis: MeetingAnalysis
}

export default function ResultsDisplay({ analysis }: ResultsDisplayProps) {
  const [participants, setParticipants] = useState(analysis.participants)
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false)
  const [refreshingEmails, setRefreshingEmails] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [currentParticipantToAdd, setCurrentParticipantToAdd] = useState<Participant | null>(null)
  const [similarParticipants, setSimilarParticipants] = useState<SimilarParticipant[]>([])
  const [contactsInBank, setContactsInBank] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load existing contacts to check which participants are already in the bank
    const loadExistingContacts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) return

        const response = await fetch('/api/participants/contacts', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const existingNames = new Set<string>(
            data.contacts?.map((contact: any) => contact.name as string) || []
          )
          setContactsInBank(existingNames)
        }
      } catch (error) {
        console.error('Error loading existing contacts:', error)
      }
    }

    loadExistingContacts()
  }, [])

  const handleParticipantUpdate = async (updatedParticipant: Participant) => {
    const index = participants.findIndex(p => p.name === analysis.participants.find(ap => ap.name === updatedParticipant.name)?.name)
    const newParticipants = [...participants]
    newParticipants[index] = updatedParticipant
    setParticipants(newParticipants)

    // Check if this is a meaningful change
    const originalParticipant = analysis.participants[index]
    const roleChanged = originalParticipant.role !== updatedParticipant.role
    const companyChanged = originalParticipant.company !== updatedParticipant.company

    if (roleChanged || companyChanged) {
      setShowRefreshPrompt(true)
    }
  }

  const handleAddToContacts = async (participant: Participant) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.error('No session found')
        return false
      }

      const response = await fetch('/api/participants/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ participant, checkForSimilar: true })
      })

      if (response.ok) {
        const data = await response.json()

        // Check if similar participants were found
        if (data.requiresConfirmation && data.similarParticipants) {
          setCurrentParticipantToAdd(participant)
          setSimilarParticipants(data.similarParticipants)
          setShowMergeModal(true)
          return false // Don't show success state yet
        } else {
          // No similar participants, contact added successfully
          setContactsInBank(prev => new Set([...prev, participant.name]))
          return true
        }
      }
    } catch (error) {
      console.error('Error adding to contacts:', error)
    }
    return false
  }

  const handleMerge = async (selectedContactId: string) => {
    if (!currentParticipantToAdd) return

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      // Update the selected contact with new participant info
      const response = await fetch('/api/participants/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: selectedContactId,
          name: currentParticipantToAdd.name,
          title: currentParticipantToAdd.title,
          role: currentParticipantToAdd.role,
          company: currentParticipantToAdd.company,
          email: currentParticipantToAdd.email
        })
      })

      if (response.ok) {
        setContactsInBank(prev => new Set([...prev, currentParticipantToAdd.name]))
        setCurrentParticipantToAdd(null)
        setSimilarParticipants([])
      }
    } catch (error) {
      console.error('Error merging contact:', error)
    }
  }

  const handleCreateNew = async () => {
    if (!currentParticipantToAdd) return

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const response = await fetch('/api/participants/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ participant: currentParticipantToAdd, checkForSimilar: false })
      })

      if (response.ok) {
        setContactsInBank(prev => new Set([...prev, currentParticipantToAdd.name]))
        setCurrentParticipantToAdd(null)
        setSimilarParticipants([])
      }
    } catch (error) {
      console.error('Error creating new contact:', error)
    }
  }

  const handleRefreshEmails = async () => {
    setRefreshingEmails(true)
    setShowRefreshPrompt(false)

    try {
      // Call API to regenerate emails with updated participant info
      const response = await fetch('/api/analyze/refresh-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: analysis.summary, // We'd need to store this
          participants: participants
        })
      })

      if (response.ok) {
        const { emails } = await response.json()
        // Update emails in the analysis
        analysis.followUpEmails = emails
      }
    } catch (error) {
      console.error('Error refreshing emails:', error)
    } finally {
      setRefreshingEmails(false)
    }
  }
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

        {showRefreshPrompt && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-900 font-medium">Participant changes detected</p>
                <p className="text-xs text-blue-700 mt-1">
                  Would you like to regenerate emails with updated participant information?
                  <span className="text-blue-600"> (costs ~$0.05)</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowRefreshPrompt(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Skip
                </button>
                <button
                  onClick={handleRefreshEmails}
                  disabled={refreshingEmails}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {refreshingEmails ? 'Refreshing...' : 'Refresh Emails'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant, index) => (
            <ParticipantCard
              key={index}
              participant={participant}
              onUpdate={handleParticipantUpdate}
              onAddToContacts={handleAddToContacts}
              isInContacts={contactsInBank.has(participant.name)}
            />
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

      <MergeConfirmationModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        newParticipant={currentParticipantToAdd || {
          name: '',
          title: '',
          role: '',
          company: '',
          email: ''
        }}
        similarParticipants={similarParticipants}
        onMerge={handleMerge}
        onCreateNew={handleCreateNew}
      />
    </div>
  )
}