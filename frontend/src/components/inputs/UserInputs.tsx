import React, { useState, useEffect } from 'react';
import ConfigureActivityList from './userInputs/ConfigureActivityList';
import AgentPrompts from './userInputs/AgentPrompts';
import InputHistory from './userInputs/InputHistory';

// Import the Activity interface from ConfigureActivityList
interface Schedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  dayOfWeek?: number; // 0-6 (Sunday to Saturday)
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  repeatEvery: number; // Repeat every X days/weeks/months
}

interface Activity {
  id: string;
  siteId: string;
  area: string;
  question: string;
  schedule: Schedule;
  enabled: boolean;
}

type InputSection = 'prompts' | 'history';

const UserInputs: React.FC = () => {
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<InputSection>('prompts');
  const [savedActivities, setSavedActivities] = useState<Activity[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load saved activities from localStorage on component mount
  useEffect(() => {
    const storedActivities = localStorage.getItem('turing-activity-list-config');
    if (storedActivities) {
      try {
        setSavedActivities(JSON.parse(storedActivities));
      } catch (error) {
        console.error('Error loading saved activities:', error);
      }
    }
  }, []);

  const openActivityModal = () => {
    setIsActivityModalOpen(true);
    setHasUnsavedChanges(false);
  };

  const closeActivityModal = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    setIsActivityModalOpen(false);
  };

  const handleSaveActivities = (activities: Activity[]) => {
    setSavedActivities(activities);
    setHasUnsavedChanges(false);
    // You can add additional logic here if needed, such as syncing with a backend
    console.log('Activities saved:', activities);
  };

  const handleActivitiesChanged = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <div className="bg-gray-50 flex flex-col h-full">
      {/* Horizontal Tab Navigation */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center px-4">
          <nav className="flex flex-1 space-x-1 overflow-x-auto py-3" aria-label="Tabs">
            <button
              onClick={() => setActiveSection('prompts')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'prompts'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Agent Prompts
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'history'
                  ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Input History
            </button>
            <div className="flex-1"></div>
            <button
              onClick={openActivityModal}
              className="ml-auto flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Configure Activity List
            </button>
          </nav>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {activeSection === 'prompts' && <AgentPrompts />}
        {activeSection === 'history' && <InputHistory />}
      </div>

      {/* Activity List Configuration Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Configure Activity List</h3>
              <button 
                onClick={closeActivityModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ConfigureActivityList 
                savedActivities={savedActivities}
                onSave={handleSaveActivities}
                onChange={handleActivitiesChanged}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInputs;
