'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

interface ParticipantContact {
  id: string
  name: string
  title?: string
  role?: string
  company?: string
  email?: string
  usage_count: number
  last_used_at: string
}

export default function ParticipantBank() {
  const [contacts, setContacts] = useState<ParticipantContact[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedContact, setEditedContact] = useState<ParticipantContact | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

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
    setEditingId(contact.id)
    setEditedContact({ ...contact })
  }

  const handleSave = async () => {
    if (!editedContact) return

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const response = await fetch('/api/participants/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(editedContact)
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
    if (!confirm('Are you sure you want to remove this contact?')) return

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  {editingId === contact.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editedContact?.name || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editedContact?.title || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, title: e.target.value })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editedContact?.company || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, company: e.target.value })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editedContact?.role || ''}
                          onChange={(e) => setEditedContact({ ...editedContact!, role: e.target.value })}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {contact.usage_count}x
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900 text-sm mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditedContact(null)
                          }}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{contact.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{contact.title || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{contact.company || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{contact.role || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {contact.usage_count}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}