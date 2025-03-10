import React, { useState, useEffect } from 'react';
import AgentPrompts from './userInputs/AgentPrompts';
import InputHistory from './userInputs/InputHistory';
import ConfigureActivities from './userInputs/ConfigureActivities';

// Import the Activity interface from ConfigureActivities
interface Schedule {
  frequency: 'monthly' | 'quarterly' | 'biannually' | 'custom';
  dayOfMonth?: number; // 1-31
  months?: number[]; // Array of months (1-12)
  time: string; // HH:MM format
}

interface Activity {
  id: string;
  inspectionAreaId: string;
  description: string;
  schedule: Schedule;
  enabled: boolean;
}

type InputSection = 'prompts' | 'history' | 'activities';

const UserInputs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<InputSection>('prompts');
  const [savedActivities, setSavedActivities] = useState<Activity[]>([]);

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

  const handleSaveActivities = (activities: Activity[]) => {
    setSavedActivities(activities);
    // You can add additional logic here if needed, such as syncing with a backend
    console.log('Activities saved:', activities);
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
            <button
              onClick={() => setActiveSection('activities')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'activities'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Configure Activities
              {savedActivities.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full shadow-sm border border-green-200 flex items-center justify-center min-w-[1.5rem]">
                  {savedActivities.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {activeSection === 'prompts' && <AgentPrompts />}
        {activeSection === 'history' && <InputHistory />}
        {activeSection === 'activities' && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <ConfigureActivities 
              savedActivities={savedActivities}
              onSave={handleSaveActivities}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInputs;
