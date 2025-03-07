import React, { useState, useEffect } from 'react';
import ConfigureActivityList from './userInputs/ConfigureActivityList';
import QueryTemplates from './userInputs/QueryTemplates';
import DefaultParameters from './userInputs/DefaultParameters';
import InputValidation from './userInputs/InputValidation';
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

type InputSection = 'templates' | 'validation' | 'parameters' | 'history';

const UserInputs: React.FC = () => {
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<InputSection>('templates');
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
    <div className="bg-white flex flex-col h-full">
      {/* Horizontal Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex items-center px-4">
          <nav className="flex flex-1 space-x-1 overflow-x-auto py-3" aria-label="Tabs">
            <button
              onClick={() => setActiveSection('templates')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'templates'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Query Templates
            </button>
            <button
              onClick={() => setActiveSection('validation')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'validation'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Input Validation
            </button>
            <button
              onClick={() => setActiveSection('parameters')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'parameters'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Default Parameters
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'history'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Input History
            </button>
            <button
              onClick={openActivityModal}
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Configure Activities
              {savedActivities.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {savedActivities.length}
                </span>
              )}
            </button>
          </nav>
          
          {/* Help Button */}
          <div className="ml-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100" title="View Documentation">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {activeSection === 'templates' && <QueryTemplates />}
        {activeSection === 'validation' && <InputValidation />}
        {activeSection === 'parameters' && <DefaultParameters />}
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
                onSave={handleSaveActivities} 
                onChange={handleActivitiesChanged}
              />
            </div>
            <div className="flex justify-end p-4 border-t">
              <button 
                onClick={closeActivityModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors mr-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInputs;
