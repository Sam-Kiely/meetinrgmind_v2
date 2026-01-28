'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ActionItem {
  id: string
  task: string
  owner: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  meeting_id: string
  meeting_title: string
  meeting_date: string
}

interface ActionItemsViewProps {
  view: 'outstanding' | 'completed'
  onClose: () => void
  onUpdate?: () => void
}

export default function ActionItemsView({ view, onClose, onUpdate }: ActionItemsViewProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [groupedItems, setGroupedItems] = useState<{ [key: string]: ActionItem[] }>({})
  const [localChanges, setLocalChanges] = useState<{ [key: string]: boolean }>({}) // Track local completion state changes

  useEffect(() => {
    fetchActionItems()
  }, [view])

  const fetchActionItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch all meetings with their action items and results
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, title, meeting_date, action_items, results')
        .eq('user_id', session.user.id)
        .order('meeting_date', { ascending: false })

      if (error) {
        console.error('Error fetching meetings:', error)
        throw error
      }

      console.log('Fetched meetings:', meetings) // Debug log

      // Flatten and filter action items based on view
      const allItems: ActionItem[] = []
      meetings?.forEach((meeting: any) => {
        // Try multiple sources for action items
        let items = meeting.action_items

        // If action_items is null/empty, try results.actionItems
        if ((!items || items.length === 0) && meeting.results?.actionItems) {
          items = meeting.results.actionItems.map((item: any, index: number) => ({
            id: item.id || `${meeting.id}-ai-${index}-${item.task?.slice(0, 5)}`,
            task: item.task,
            owner: item.owner,
            deadline: item.deadline,
            priority: item.priority || 'medium',
            completed: item.completed || false
          }))
        }

        console.log(`Meeting ${meeting.title} action items:`, items) // Debug log

        if (Array.isArray(items) && items.length > 0) {
          items.forEach((item: any, itemIndex: number) => {
            // Ensure item has required fields and unique ID
            const actionItem = {
              id: item.id || `${meeting.id}-item-${itemIndex}-${Date.now()}`,
              task: item.task || '',
              owner: item.owner || '',
              deadline: item.deadline || '',
              priority: item.priority || 'medium' as 'high' | 'medium' | 'low',
              completed: item.completed || false,
              meeting_id: meeting.id,
              meeting_title: meeting.title,
              meeting_date: meeting.meeting_date
            }

            // Filter based on ORIGINAL completed state, not local changes
            const originalCompleted = item.completed || false
            if ((view === 'outstanding' && !originalCompleted) ||
                (view === 'completed' && originalCompleted)) {
              allItems.push(actionItem)
            }
          })
        }
      })

      // Group by meeting
      const grouped = allItems.reduce((acc, item) => {
        const key = `${item.meeting_title}|${item.meeting_date}|${item.meeting_id}`
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
      }, {} as { [key: string]: ActionItem[] })

      setGroupedItems(grouped)
      setActionItems(allItems)
    } catch (error) {
      console.error('Error fetching action items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = (item: ActionItem) => {
    // Update local changes state to track what user has toggled
    const currentState = localChanges[item.id] !== undefined ? localChanges[item.id] : item.completed
    const newState = !currentState

    setLocalChanges(prev => ({
      ...prev,
      [item.id]: newState
    }))

    // Update the actionItems state to reflect the visual change
    setActionItems(prevItems =>
      prevItems.map(actionItem =>
        actionItem.id === item.id
          ? { ...actionItem, completed: newState }
          : actionItem
      )
    )

    // Update grouped items as well
    setGroupedItems(prevGrouped => {
      const newGrouped = { ...prevGrouped }
      Object.keys(newGrouped).forEach(key => {
        newGrouped[key] = newGrouped[key].map(actionItem =>
          actionItem.id === item.id
            ? { ...actionItem, completed: newState }
            : actionItem
        )
      })
      return newGrouped
    })
  }

  const saveChangesAndClose = async () => {
    // Save all local changes to the database before closing
    if (Object.keys(localChanges).length > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          onClose()
          return
        }

        // Group changes by meeting to minimize API calls
        const changesByMeeting: { [meetingId: string]: { itemId: string; newState: boolean }[] } = {}

        actionItems.forEach(item => {
          if (localChanges[item.id] !== undefined) {
            if (!changesByMeeting[item.meeting_id]) {
              changesByMeeting[item.meeting_id] = []
            }
            changesByMeeting[item.meeting_id].push({
              itemId: item.id,
              newState: localChanges[item.id]
            })
          }
        })

        // Save changes for each meeting
        const savePromises = Object.entries(changesByMeeting).map(async ([meetingId, changes]) => {
          // Get current meeting data
          const { data: meeting } = await supabase
            .from('meetings')
            .select('id, action_items, results')
            .eq('id', meetingId)
            .single()

          if (!meeting) return

          // Get action items from either source
          let currentItems = (meeting as any).action_items
          if (!currentItems || (Array.isArray(currentItems) && currentItems.length === 0)) {
            currentItems = (meeting as any).results?.actionItems || []
          }

          // Apply all changes for this meeting
          const updatedItems = currentItems.map((ai: any) => {
            const change = changes.find(c => c.itemId === ai.id)
            if (change) {
              return { ...ai, completed: change.newState }
            }
            return ai
          })

          // Save to database
          const response = await fetch(`/api/meetings/${meetingId}/action-items`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ actionItems: updatedItems })
          })

          if (!response.ok) {
            console.error('Failed to save changes for meeting:', meetingId)
          }
        })

        await Promise.all(savePromises)

        // Notify parent to refresh
        onUpdate?.()
      } catch (error) {
        console.error('Error saving changes:', error)
      }
    }

    onClose()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getDeadlineStatus = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-600' }
    if (diffDays <= 3) return { text: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, color: 'text-amber-600' }
    return { text: new Date(deadline).toLocaleDateString(), color: 'text-gray-600' }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {view === 'outstanding' ? 'Outstanding Action Items' : 'Completed Tasks'}
          </h2>
          <button
            onClick={saveChangesAndClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : actionItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">
                {view === 'outstanding'
                  ? 'No outstanding action items'
                  : 'No completed tasks yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([key, items]) => {
                const [title, date, meetingId] = key.split('|')
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => {
                        const deadlineStatus = getDeadlineStatus(item.deadline)
                        return (
                          <div
                            key={item.id}
                            className={`p-3 border rounded-lg bg-white ${
                              item.completed ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-start">
                              <button
                                onClick={() => handleToggleComplete(item)}
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-3 mt-0.5 transition-all duration-200 ${
                                  item.completed
                                    ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                                title={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                {item.completed && (
                                  <svg className="w-3 h-3 text-white m-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>

                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className={`font-medium transition-all duration-200 ${
                                      item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                    }`}>
                                      {item.task}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-1 text-sm">
                                      <span className={`transition-all duration-200 ${
                                        item.completed ? 'text-gray-500' : 'text-gray-600'
                                      }`}>
                                        Owner: {item.owner}
                                      </span>
                                      <span className={`transition-all duration-200 ${
                                        item.completed ? 'text-gray-500' : deadlineStatus.color
                                      }`}>
                                        {deadlineStatus.text}
                                      </span>
                                    </div>
                                  </div>

                                  <span className={`ml-3 px-2 py-1 text-xs rounded border ${
                                    getPriorityColor(item.priority)
                                  }`}>
                                    {item.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {actionItems.length} {view === 'outstanding' ? 'outstanding' : 'completed'} item{actionItems.length !== 1 ? 's' : ''} across {Object.keys(groupedItems).length} meeting{Object.keys(groupedItems).length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={saveChangesAndClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}