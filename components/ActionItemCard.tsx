import { ActionItem } from '@/types'

interface ActionItemCardProps {
  actionItem: ActionItem
}

const priorityStyles = {
  high: 'border-l-red-500 bg-red-50 text-red-800',
  medium: 'border-l-amber-500 bg-amber-50 text-amber-800',
  low: 'border-l-blue-500 bg-blue-50 text-blue-800'
}

const priorityLabels = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority'
}

export default function ActionItemCard({ actionItem }: ActionItemCardProps) {
  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${priorityStyles[actionItem.priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">{actionItem.task}</h4>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Owner:</span> {actionItem.owner}</p>
            <p><span className="font-medium">Deadline:</span> {actionItem.deadline}</p>
          </div>
        </div>
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${priorityStyles[actionItem.priority]}`}>
          {priorityLabels[actionItem.priority]}
        </span>
      </div>
    </div>
  )
}