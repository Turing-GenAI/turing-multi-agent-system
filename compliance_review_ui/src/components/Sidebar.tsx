import { FiSearch, FiHome, FiFolder, FiClock, FiRefreshCw, FiSettings, FiMoreHorizontal } from 'react-icons/fi'
import { TrialItem } from './TrialItem'

interface SidebarProps {
  selectedTrial: string
}

export function Sidebar({ selectedTrial }: SidebarProps) {
  const trials = [
    {
      name: 'Phase III Study of Drug X for Lung Cancer',
      location: 'Mayo Clinic, MN',
      warnings: 10,
      timeAgo: 'Today',
    },
    {
      name: 'Phase II Trial of Therapy Y for Heart Disease',
      location: 'Cleveland Clinic, OH',
      warnings: 5,
      timeAgo: '2 days ago',
    },
    {
      name: 'Phase I Study of Treatment Z for Diabetes',
      location: 'Johns Hopkins, MD',
      warnings: 3,
      timeAgo: '3 days ago',
    },
    {
      name: 'Phase III Trial of Vaccine A for Influenza',
      location: 'Massachusetts General Hospital',
      warnings: 12,
      timeAgo: '4 days ago',
    },
    {
      name: 'Phase II Study of Drug B for Alzheimer\'s',
      location: 'Mount Sinai, NY',
      warnings: 8,
      timeAgo: '5 days ago',
    },
    {
      name: 'Phase IV Study of Drug C for Arthritis',
      location: 'UCLA Medical Center, CA',
      warnings: 10,
      timeAgo: '1 week ago',
    },
    {
      name: 'Phase III Trial of Therapy D for Multiple Sclerosis',
      location: 'Stanford Health Care, CA',
      warnings: 6,
      timeAgo: '1 week ago',
    }
  ]

  return (
    <div className="w-80 bg-sidebar border-r border-gray-200 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <FiHome className="text-white" />
          </div>
          <span className="font-medium">Trials</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Reviewed</span>
          <div className="w-8 h-4 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Type to search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
          />
        </div>
      </div>
      <nav className="px-2 py-4 border-b border-gray-200 flex">
        <button className="w-full p-2 rounded hover:bg-gray-100 flex items-center gap-3 text-sm">
          <FiFolder className="text-gray-400" />
          <span>All trials</span>
        </button>
        <button className="w-full p-2 rounded hover:bg-gray-100 flex items-center gap-3 text-sm">
          <FiClock className="text-gray-400" />
          <span>Recent</span>
        </button>
        <button className="w-full p-2 rounded hover:bg-gray-100 flex items-center gap-3 text-sm">
          <FiRefreshCw className="text-gray-400" />
          <span>In progress</span>
        </button>
  
      </nav>
      <div className="flex-1 overflow-auto">
        {trials.map((trial) => (
          <TrialItem
            key={trial.name}
            {...trial}
            isSelected={trial.name === selectedTrial}
          />
        ))}
      </div>
    </div>
  )
}