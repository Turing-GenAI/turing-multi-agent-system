interface TrialItemProps {
  name: string
  location: string
  warnings: number
  timeAgo: string
  isSelected: boolean
}

export function TrialItem({ name, location, warnings, timeAgo, isSelected }: TrialItemProps) {
  return (
    <div className={`p-4 cursor-pointer ${isSelected ? 'bg-white' : 'hover:bg-gray-50'}`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm text-gray-600">{location}</span>
        <span className="text-sm text-gray-400">{timeAgo}</span>
      </div>
      <h3 className="font-medium mb-1">{name}</h3>
      <div className="text-sm text-warning">
        {warnings} warnings
      </div>
    </div>
  )
}