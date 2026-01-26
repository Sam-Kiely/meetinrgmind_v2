'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MeetingAnalysis } from '@/types'
import { useAuth } from '@/lib/auth'
import { EmailSection } from '@/components/EmailSection'

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

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<SavedMeeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<SavedMeeting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const userId = user?.id || 'demo-user-id'

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`/api/meetings?userId=${userId}`)
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
      // Update local state
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

        // Save to localStorage
        localStorage.setItem(`meetings_${userId}`, JSON.stringify(updatedMeetings))
      }

    } catch (err) {
      console.error('Error updating action item:', err)
      setError('Failed to update action item')
    }
  }

  const deleteActionItem = async (actionItemId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return

    try {
      // Update local state
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

        // Save to localStorage
        localStorage.setItem(`meetings_${userId}`, JSON.stringify(updatedMeetings))
      }

    } catch (err) {
      console.error('Error deleting action item:', err)
      setError('Failed to delete action item')
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
    return { total, completed }
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

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {meetings.reduce((sum, meeting) => sum + getActionItemsStats(meeting).total, 0)}
                  </p>
                  <p className="text-gray-600">Total Action Items</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {meetings.reduce((sum, meeting) => sum + getActionItemsStats(meeting).completed, 0)}
                  </p>
                  <p className="text-gray-600">Completed Tasks</p>
                </div>
              </div>
            </div>
          </div>

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
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMeetingClick(meeting.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
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
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
          <Link
            href="/"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            New Meeting
          </Link>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedMeeting.title}</h1>
            <p className="text-gray-600 mb-4">
              {new Date(selectedMeeting.meeting_date).toLocaleDateString()} •{' '}
              {selectedMeeting.results.participants?.length || 0} participants
            </p>
            <p className="text-gray-700 leading-relaxed">{selectedMeeting.results.summary}</p>
          </div>

          {/* Participants */}
          {selectedMeeting.results.participants?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">👥 Meeting Participants</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedMeeting.results.participants.map((participant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-semibold text-gray-900">{participant.name}</h4>
                        {participant.title && (
                          <p className="text-sm text-gray-600">{participant.title}</p>
                        )}
                        {participant.role && (
                          <p className="text-xs text-gray-500">{participant.role}</p>
                        )}
                        {participant.company && (
                          <p className="text-xs text-blue-600">{participant.company}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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