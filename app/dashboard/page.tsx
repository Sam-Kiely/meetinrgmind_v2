'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MeetingAnalysis } from '@/types'
import { useAuth } from '@/lib/auth'
import { EmailSection } from '@/components/EmailSection'
import ParticipantBank from '@/components/ParticipantBank'
import ResultsDisplay from '@/components/ResultsDisplay'
import ActionItemsView from '@/components/ActionItemsView'
import { supabase } from '@/lib/supabase'

interface SavedMeeting {
  id: string
  title: string
  meeting_date: string
  created_at: string
  results: MeetingAnalysis
  action_items: Array<{
    id: string
    task: string
    owner: string
    deadline: string
    priority: 'high' | 'medium' | 'low'
    completed: boolean
  }>
}

function DashboardContent() {
  const [meetings, setMeetings] = useState<SavedMeeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<SavedMeeting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showActionItems, setShowActionItems] = useState<'outstanding' | 'completed' | null>(null)
  const { user } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (user?.id) {
      fetchMeetings()
    } else {
      setIsLoading(false)
    }
  }, [user?.id])

  // Handle URL parameter for direct meeting navigation
  useEffect(() => {
    const meetingIdFromUrl = searchParams.get('meeting')
    if (meetingIdFromUrl && meetings.length > 0 && !selectedMeeting) {
      const meeting = meetings.find(m => m.id === meetingIdFromUrl)
      if (meeting) {
        setSelectedMeeting(meeting)
        // Clear the URL parameter to avoid issues with navigation
        window.history.replaceState({}, '', '/dashboard')
      }
    }
  }, [searchParams, meetings, selectedMeeting])

  const fetchMeetings = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/meetings?userId=${user.id}`)
      if (!response.ok) throw new Error('Failed to fetch meetings')

      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (err) {
      setError('Failed to load meetings')
      console.error('Error fetching meetings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMeetingClick = async (meetingId: string) => {
    try {
      const meeting = meetings.find(m => m.id === meetingId)
      if (meeting) {
        setSelectedMeeting(meeting)
      }
    } catch (err) {
      setError('Failed to load meeting details')
      console.error('Error fetching meeting:', err)
    }
  }

  const updateActionItem = async (actionItemId: string, completed: boolean) => {
    try {
      // Update local state immediately for responsiveness
      if (selectedMeeting) {
        const updatedActionItems = selectedMeeting.action_items.map(item =>
          item.id === actionItemId ? { ...item, completed } : item
        )
        const updatedMeeting = {
          ...selectedMeeting,
          action_items: updatedActionItems
        }
        setSelectedMeeting(updatedMeeting)

        // Also update the meetings list
        const updatedMeetings = meetings.map(meeting => {
          if (meeting.id === selectedMeeting?.id) {
            return updatedMeeting
          }
          return meeting
        })
        setMeetings(updatedMeetings)

        // Persist to database using API endpoint
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          try {
            const response = await fetch(`/api/meetings/${selectedMeeting.id}/action-items`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ actionItems: updatedActionItems })
            })

            if (!response.ok) {
              console.error('Error saving action item status')
            }
          } catch (error) {
            console.error('Error saving action item status:', error)
          }
        }
      }

    } catch (err) {
      console.error('Error updating action item:', err)
      setError('Failed to update action item')
    }
  }

  const deleteActionItem = async (actionItemId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return

    try {
      // Update local state immediately
      if (selectedMeeting) {
        const updatedActionItems = selectedMeeting.action_items.filter(item => item.id !== actionItemId)
        const updatedMeeting = {
          ...selectedMeeting,
          action_items: updatedActionItems
        }
        setSelectedMeeting(updatedMeeting)

        // Also update the meetings list
        const updatedMeetings = meetings.map(meeting => {
          if (meeting.id === selectedMeeting?.id) {
            return updatedMeeting
          }
          return meeting
        })
        setMeetings(updatedMeetings)

        // Persist to database using API endpoint
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          try {
            const response = await fetch(`/api/meetings/${selectedMeeting.id}/action-items`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ actionItems: updatedActionItems })
            })

            if (!response.ok) {
              console.error('Error saving action item status')
            }
          } catch (error) {
            console.error('Error saving action item status:', error)
          }
        }
      }

    } catch (err) {
      console.error('Error deleting action item:', err)
      setError('Failed to delete action item')
    }
  }

  const deleteMeeting = async (meetingId: string, retainParticipants: boolean = false) => {
    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/meetings/${meetingId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ retainParticipants })
      })

      if (!response.ok) {
        throw new Error('Failed to delete meeting')
      }

      const data = await response.json()

      // Remove meeting from local state
      const updatedMeetings = meetings.filter(m => m.id !== meetingId)
      setMeetings(updatedMeetings)

      // If we were viewing this meeting, go back to dashboard
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null)
      }

      // Show success message
      if (data.orphanedParticipants?.length > 0) {
        const action = retainParticipants ? 'retained' : 'removed'
        alert(`Meeting deleted. ${data.orphanedParticipants.length} participants ${action} from your contact bank.`)
      }

      // Trigger participant bank refresh
      window.dispatchEvent(new Event('participantBankRefresh'))

      return data
    } catch (err) {
      console.error('Error deleting meeting:', err)
      setError('Failed to delete meeting')
      throw err
    }
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this meeting? This action cannot be undone.')
    if (!confirmDelete) return

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Authentication required')
        return
      }

      // First, check for orphaned participants by doing a test delete
      const response = await fetch(`/api/meetings/${meetingId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ retainParticipants: false })
      })

      if (response.ok) {
        const data = await response.json()

        // If there are orphaned participants, ask user what to do
        if (data.orphanedParticipants?.length > 0) {
          const retain = confirm(
            `This meeting has ${data.orphanedParticipants.length} participant(s) (${data.orphanedParticipants.join(', ')}) that won't appear in any other meetings.\n\nWould you like to keep them in your contact bank? (Click Cancel to remove them)`
          )

          // Delete again with the user's preference
          await deleteMeeting(meetingId, retain)
        } else {
          // No orphaned participants, just update UI
          const updatedMeetings = meetings.filter(m => m.id !== meetingId)
          setMeetings(updatedMeetings)

          if (selectedMeeting?.id === meetingId) {
            setSelectedMeeting(null)
          }

          // Trigger participant bank refresh
          window.dispatchEvent(new Event('participantBankRefresh'))
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete meeting')
      }
    } catch (err) {
      console.error('Error deleting meeting:', err)
      setError('Failed to delete meeting: ' + (err as Error).message)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getActionItemsStats = (meeting: SavedMeeting) => {
    const total = meeting.action_items?.length || 0
    const completed = meeting.action_items?.filter(item => item.completed).length || 0
    const outstanding = total - completed
    return { total, completed, outstanding }
  }

  const getAllActionItemsStats = () => {
    const stats = meetings.reduce((acc, meeting) => {
      const meetingStats = getActionItemsStats(meeting)
      return {
        total: acc.total + meetingStats.total,
        completed: acc.completed + meetingStats.completed,
        outstanding: acc.outstanding + meetingStats.outstanding
      }
    }, { total: 0, completed: 0, outstanding: 0 })
    return stats
  }

  if (isLoading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-8">You need to be logged in to view your dashboard.</p>
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!selectedMeeting) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Your meeting analysis history</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              New Meeting
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-black rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
                  <p className="text-gray-600">Meetings This Month</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowActionItems('outstanding')}
              className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow cursor-pointer group w-full"
            >
              <div className="flex items-center">
                <div className="p-3 bg-amber-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {getAllActionItemsStats().outstanding}
                  </p>
                  <p className="text-gray-600">Outstanding Action Items</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setShowActionItems('completed')}
              className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow cursor-pointer group w-full"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {getAllActionItemsStats().completed}
                  </p>
                  <p className="text-gray-600">Completed Tasks</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Action Items Modal */}
          {showActionItems && (
            <ActionItemsView
              view={showActionItems}
              onClose={() => setShowActionItems(null)}
            />
          )}

          {/* Participant Bank */}
          <ParticipantBank />

          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Meetings</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {meetings.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">No meetings analyzed yet</p>
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Analyze Your First Meeting
                  </Link>
                </div>
              ) : (
                meetings.map((meeting) => {
                  const stats = getActionItemsStats(meeting)
                  return (
                    <div
                      key={meeting.id}
                      className="px-6 py-4 hover:bg-gray-50 group"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleMeetingClick(meeting.id)}
                        >
                          <h3 className="text-lg font-medium text-gray-900">{meeting.title}</h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {new Date(meeting.meeting_date).toLocaleDateString()} •{' '}
                            {meeting.results.participants?.length || 0} participants •{' '}
                            {stats.total} action items
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {meeting.results.summary}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 ml-4">
                          <span className="whitespace-nowrap">{stats.completed}/{stats.total} completed</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMeeting(meeting.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600"
                            title="Delete meeting"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div
                            className="cursor-pointer"
                            onClick={() => handleMeetingClick(meeting.id)}
                          >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Meeting detail view
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setSelectedMeeting(null)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleDeleteMeeting(selectedMeeting.id)}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete Meeting
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              New Meeting
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedMeeting.title}</h1>
            <p className="text-gray-600 mb-4">
              {new Date(selectedMeeting.meeting_date).toLocaleDateString()} •{' '}
              {selectedMeeting.results.participants?.length || 0} participants
            </p>
          </div>

          {/* Use ResultsDisplay for full editable functionality */}
          <ResultsDisplay analysis={selectedMeeting.results} />

          {/* Action Items with Management */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">✅ Action Items</h3>
            <div className="space-y-4">
              {selectedMeeting.action_items?.length === 0 ? (
                <p className="text-gray-500">No action items found in this meeting.</p>
              ) : (
                selectedMeeting.action_items?.map((item) => (
                  <div
                    key={item.id}
                    className={`border-l-4 p-4 rounded-r-lg ${
                      item.priority === 'high' ? 'border-l-red-500 bg-red-50' :
                      item.priority === 'medium' ? 'border-l-amber-500 bg-amber-50' :
                      'border-l-blue-500 bg-blue-50'
                    } ${item.completed ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => updateActionItem(item.id, e.target.checked)}
                          className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h4 className={`font-semibold ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.task}
                          </h4>
                          <div className="text-sm space-y-1 mt-1">
                            <p className="text-gray-700"><span className="font-medium text-gray-900">Owner:</span> {item.owner}</p>
                            <p className="text-gray-700"><span className="font-medium text-gray-900">Deadline:</span> {item.deadline}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority} priority
                        </span>
                        <button
                          onClick={() => deleteActionItem(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete action item"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Other sections */}
          {selectedMeeting.results.decisions?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">🎯 Decisions Made</h3>
              <ul className="space-y-3">
                {selectedMeeting.results.decisions.map((decision, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2 mr-3"></span>
                    <span className="text-gray-700">{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedMeeting.results.keyDates?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">📅 Key Dates</h3>
              <div className="space-y-3">
                {selectedMeeting.results.keyDates.map((keyDate, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{keyDate.event}</span>
                    <span className="text-gray-600">{keyDate.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Emails - Always show, component handles empty state */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <EmailSection emails={selectedMeeting.results.followUpEmails || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}