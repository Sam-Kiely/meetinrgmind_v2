'use client'

import { useState } from 'react'
import { MeetingAnalysis, Participant } from '@/types'
import ActionItemCard from './ActionItemCard'
import { EmailSection } from './EmailSection'
import ParticipantCard from './ParticipantCard'

interface ResultsDisplayProps {
  analysis: MeetingAnalysis
}

export default function ResultsDisplay({ analysis }: ResultsDisplayProps) {
  const [participants, setParticipants] = useState(analysis.participants)
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false)
  const [refreshingEmails, setRefreshingEmails] = useState(false)

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
      const response = await fetch('/api/participants/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participant)
      })

      if (response.ok) {
        // Show success toast or notification
        console.log('Added to contacts')
      }
    } catch (error) {
      console.error('Error adding to contacts:', error)
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
    </div>
  )
}