'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Meeting {
  id: string
  title: string
  date: string
  summary: string
}

interface ParticipantContact {
  contact_id: string
  name: string
  title?: string
  role?: string
  company?: string
  email?: string
  manually_retained: boolean
  meeting_count: number
  meetings: Meeting[]
}

export default function ParticipantBank() {
  const [contacts, setContacts] = useState<ParticipantContact[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedContact, setEditedContact] = useState<ParticipantContact | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/participants/contacts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (contact: ParticipantContact) => {
    setEditingId(contact.contact_id)
    setEditedContact({ ...contact })
  }

  const handleSave = async () => {
    if (!editedContact) return

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const response = await fetch('/api/participants/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: editedContact.contact_id,
          name: editedContact.name,
          title: editedContact.title,
          role: editedContact.role,
          company: editedContact.company,
          email: editedContact.email
        })
      })

      if (response.ok) {
        await fetchContacts()
        setEditingId(null)
        setEditedContact(null)
      }
    } catch (error) {
      console.error('Error updating contact:', error)
    }
  }

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this contact from your bank?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const response = await fetch(`/api/participants/contacts?id=${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        await fetchContacts()
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  const toggleExpanded = (contactId: string) => {
    setExpandedId(expandedId === contactId ? null : contactId)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Participant Bank</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">👥 Participant Bank</h2>
        <div className="text-sm text-gray-600">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} saved
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-medium mb-2">No contacts yet</p>
          <p className="text-sm">Start adding participants from your meetings to build your contact bank.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.contact_id} className="border border-gray-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === contact.contact_id ? (
                      <div className="grid grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={editedContact?.name || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, name: e.target.value })}
                          className="px-2 py-1 text-sm border rounded"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={editedContact?.title || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, title: e.target.value })}
                          className="px-2 py-1 text-sm border rounded"
                          placeholder="Title"
                        />
                        <input
                          type="text"
                          value={editedContact?.company || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, company: e.target.value })}
                          className="px-2 py-1 text-sm border rounded"
                          placeholder="Company"
                        />
                        <input
                          type="text"
                          value={editedContact?.role || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, role: e.target.value })}
                          className="px-2 py-1 text-sm border rounded"
                          placeholder="Role"
                        />
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                            {contact.manually_retained && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                Manually retained
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            {contact.title && <span>{contact.title}</span>}
                            {contact.company && <span className="text-blue-600">{contact.company}</span>}
                            {contact.role && <span>{contact.role}</span>}
                          </div>
                          <div className="mt-2">
                            {contact.meeting_count > 0 ? (
                              <button
                                onClick={() => toggleExpanded(contact.contact_id)}
                                className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${expandedId === contact.contact_id ? 'rotate-90' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span>
                                  {contact.meeting_count} meeting{contact.meeting_count !== 1 ? 's' : ''}
                                </span>
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No meetings recorded
                                {contact.manually_retained && ' (manually retained)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {editingId === contact.contact_id ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="px-3 py-1 text-sm text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditedContact(null)
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(contact)}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.contact_id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded meeting list */}
                {expandedId === contact.contact_id && contact.meetings.length > 0 && (
                  <div className="mt-4 pl-7 space-y-2">
                    {contact.meetings.map((meeting) => (
                      <div key={meeting.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(meeting.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {meeting.summary}
                            </p>
                          </div>
                          <button
                            onClick={() => window.location.href = `/dashboard?meeting=${meeting.id}`}
                            className="ml-3 text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}