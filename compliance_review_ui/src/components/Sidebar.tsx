import React, { useState } from 'react';
import * as Switch from '@radix-ui/react-switch';

interface Trial {
  id: string;
  site: string;
  title: string;
  warningCount: number;
  progress: number;
  daysAgo: number | 'Today';
}

interface SidebarProps {
  onTrialSelect?: (trialId: string) => void;
  selectedTrial: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onTrialSelect, selectedTrial }) => {
  // selectedTrial is used for identifying which trial is currently selected
  const [searchQuery, setSearchQuery] = useState('');
  const [showReviewed, setShowReviewed] = useState(false);

  // Mock data matching the image exactly
  const trials: Trial[] = [
    {
      id: '1',
      site: 'Mayo Clinic, MN',
      title: 'Phase III Study of Drug X for Lung Cancer',
      warningCount: 10,
      progress: 30,
      daysAgo: 'Today'
    },
    {
      id: '2',
      site: 'Cleveland Clinic, OH',
      title: 'Phase II Trial of Therapy Y for Heart Disease',
      warningCount: 10,
      progress: 45,
      daysAgo: 2
    },
    {
      id: '3',
      site: 'Johns Hopkins, MD',
      title: 'Phase I Study of Treatment Z for Diabetes',
      warningCount: 10,
      progress: 100,
      daysAgo: 3
    },
    {
      id: '4',
      site: 'Massachusetts General Hosp.',
      title: 'Phase III Trial of Vaccine A for Influenza',
      warningCount: 10,
      progress: 75,
      daysAgo: 4
    },
    {
      id: '5',
      site: 'Mount Sinai, NY',
      title: "Phase II Study of Drug B for Alzheimer's",
      warningCount: 10,
      progress: 60,
      daysAgo: 5
    },
    {
      id: '6',
      site: 'UCLA Medical Center, CA',
      title: 'Phase IV Study of Drug C for Arthritis',
      warningCount: 10,
      progress: 100,
      daysAgo: 7
    },
    {
      id: '7',
      site: 'Stanford Health Care, CA',
      title: 'Phase III Trial of Therapy D for Multiple Sclerosis',
      warningCount: 10,
      progress: 25,
      daysAgo: 7
    },
    {
      id: '8',
      site: 'Massachusetts General Hosp.',
      title: 'Phase II Study of Treatment E',
      warningCount: 10,
      progress: 90,
      daysAgo: 4
    }
  ];

  const filteredTrials = trials.filter(trial => {
    // First filter by search query
    const matchesSearch = trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.site.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Then filter by review status if toggle is on
    const matchesReviewStatus = showReviewed ? trial.progress === 100 : true;
    
    return matchesSearch && matchesReviewStatus;
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Trials</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Reviewed</span>
            <Switch.Root
              checked={showReviewed}
              onCheckedChange={setShowReviewed}
              className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${showReviewed ? 'bg-black' : 'bg-gray-200'}`}
            >
              <Switch.Thumb 
                className="block w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 transform data-[state=checked]:translate-x-4 shadow-sm"
              />
            </Switch.Root>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 rounded-md text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Scrollable Trials List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4">
          {filteredTrials.map((trial, index) => (
            <div
              key={trial.id}
              className={`cursor-pointer py-4 ${
                trial.id === selectedTrial ? 'bg-gray-50 border-l-4 border-l-black pl-2' : 'pl-3'
              } ${index !== filteredTrials.length - 1 ? 'border-b border-gray-100' : ''}`}
              onClick={() => onTrialSelect?.(trial.id)}
            >
              <div className="mb-2">
                <div className="text-xs text-gray-500 flex justify-between items-center mb-1">
                  <span>{trial.site}</span>
                  <span>{trial.daysAgo === 'Today' ? 'Today' : `${trial.daysAgo} days ago`}</span>
                </div>
                <h3 className="text-sm font-normal leading-tight">{trial.title}</h3>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{trial.warningCount} warnings</span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${trial.progress}%` }}
                    />
                  </div>
                  <span>{trial.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};