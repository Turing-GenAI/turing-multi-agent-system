import React, { useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
  areas: string[];
}

// Mock data for sites and areas
const mockSites: Site[] = [
  {
    id: 'site1',
    name: 'Site 1',
    areas: ['Area A', 'Area B', 'Area C']
  },
  {
    id: 'site2',
    name: 'Site 2',
    areas: ['Area X', 'Area Y', 'Area Z']
  },
  {
    id: 'site3',
    name: 'Site 3',
    areas: ['Area 1', 'Area 2', 'Area 3']
  }
];

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

interface ConfigureActivityListProps {
  savedActivities?: Activity[]; // Add this prop to accept saved activities from parent
  onSave?: (activities: Activity[]) => void;
  onChange?: () => void;
}

const STORAGE_KEY = 'turing-activity-list-config';

const ConfigureActivityList: React.FC<ConfigureActivityListProps> = ({ savedActivities, onSave, onChange }) => {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>(savedActivities || []);
  
  // Scheduling states
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1); // Monday
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState<number>(1);
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [scheduleRepeatEvery, setScheduleRepeatEvery] = useState<number>(1);
  const [showSchedulePanel, setShowSchedulePanel] = useState<boolean>(false);

  // Load saved activities from localStorage on component mount
  useEffect(() => {
    if (!savedActivities) {
      const savedActivities = localStorage.getItem(STORAGE_KEY);
      if (savedActivities) {
        try {
          setActivities(JSON.parse(savedActivities));
        } catch (error) {
          console.error('Error loading saved activities:', error);
        }
      }
    }
  }, [savedActivities]);

  // Get areas for the selected site
  const availableAreas = mockSites.find(site => site.id === selectedSite)?.areas || [];

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = e.target.value;
    setSelectedSite(siteId);
    setSelectedArea(''); // Reset area when site changes
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedArea(e.target.value);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomQuestion(e.target.value);
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom');
  };

  const handleDayOfWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScheduleDayOfWeek(parseInt(e.target.value));
  };

  const handleDayOfMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScheduleDayOfMonth(parseInt(e.target.value));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleTime(e.target.value);
  };

  const handleRepeatEveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleRepeatEvery(parseInt(e.target.value));
  };

  const toggleSchedulePanel = () => {
    setShowSchedulePanel(!showSchedulePanel);
  };

  const handleAddActivity = () => {
    if (selectedSite && selectedArea && customQuestion.trim()) {
      const schedule: Schedule = {
        frequency: scheduleFrequency,
        time: scheduleTime,
        repeatEvery: scheduleRepeatEvery
      };

      if (scheduleFrequency === 'weekly') {
        schedule.dayOfWeek = scheduleDayOfWeek;
      } else if (scheduleFrequency === 'monthly') {
        schedule.dayOfMonth = scheduleDayOfMonth;
      }

      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        siteId: selectedSite,
        area: selectedArea,
        question: customQuestion.trim(),
        schedule,
        enabled: true
      };
      
      const updatedActivities = [...activities, newActivity];
      setActivities(updatedActivities);
      
      // Notify parent component of changes
      if (onChange) {
        onChange();
      }
      
      setCustomQuestion(''); // Clear the question input
      setShowSchedulePanel(false); // Hide schedule panel after adding
    }
  };

  const handleRemoveActivity = (activityId: string) => {
    const updatedActivities = activities.filter(activity => activity.id !== activityId);
    setActivities(updatedActivities);
    
    // Notify parent component of changes
    if (onChange) {
      onChange();
    }
  };

  const handleToggleActivity = (activityId: string) => {
    const updatedActivities = activities.map(activity => 
      activity.id === activityId 
        ? { ...activity, enabled: !activity.enabled } 
        : activity
    );
    setActivities(updatedActivities);
    
    // Notify parent component of changes
    if (onChange) {
      onChange();
    }
  };

  const handleSaveActivities = () => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    
    // Call the onSave callback if provided
    if (onSave) {
      onSave(activities);
    }
    
    // Show success message
    alert('Activity list saved successfully!');
  };

  const getScheduleDescription = (schedule: Schedule): string => {
    let description = '';
    
    switch (schedule.frequency) {
      case 'daily':
        description = `Every ${schedule.repeatEvery > 1 ? `${schedule.repeatEvery} days` : 'day'}`;
        break;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = schedule.dayOfWeek !== undefined ? days[schedule.dayOfWeek] : 'Monday';
        description = `Every ${schedule.repeatEvery > 1 ? `${schedule.repeatEvery} weeks` : 'week'} on ${dayName}`;
        break;
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth || 1;
        description = `Every ${schedule.repeatEvery > 1 ? `${schedule.repeatEvery} months` : 'month'} on day ${dayOfMonth}`;
        break;
      case 'custom':
        description = 'Custom schedule';
        break;
    }
    
    return `${description} at ${schedule.time}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Configure Activity List</h2>
      <p className="text-gray-600 mb-6">
        Choose a site area, enter custom questions, and set up a schedule for your activities.
      </p>

      <div className="space-y-6">
        {/* Site and Area Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Site
            </label>
            <select
              id="site-select"
              value={selectedSite}
              onChange={handleSiteChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a Site --</option>
              {mockSites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="area-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Area
            </label>
            <select
              id="area-select"
              value={selectedArea}
              onChange={handleAreaChange}
              disabled={!selectedSite}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">-- Select an Area --</option>
              {availableAreas.map(area => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Question Input */}
        <div>
          <label htmlFor="custom-question" className="block text-sm font-medium text-gray-700 mb-1">
            Custom Question
          </label>
          <textarea
            id="custom-question"
            value={customQuestion}
            onChange={handleQuestionChange}
            placeholder="Enter your custom question here..."
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedArea}
          ></textarea>
        </div>

        {/* Schedule Configuration Button */}
        <div>
          <button
            onClick={toggleSchedulePanel}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center"
            disabled={!selectedSite || !selectedArea || !customQuestion.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showSchedulePanel ? 'Hide Schedule Options' : 'Configure Schedule'}
          </button>
        </div>

        {/* Schedule Configuration Panel */}
        {showSchedulePanel && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-medium mb-3">Schedule Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="frequency-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  id="frequency-select"
                  value={scheduleFrequency}
                  onChange={handleFrequencyChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label htmlFor="repeat-every" className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat Every
                </label>
                <div className="flex items-center">
                  <input
                    id="repeat-every"
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleRepeatEvery}
                    onChange={handleRepeatEveryChange}
                    className="w-20 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {scheduleFrequency === 'daily' ? 'Day(s)' : 
                     scheduleFrequency === 'weekly' ? 'Week(s)' : 
                     scheduleFrequency === 'monthly' ? 'Month(s)' : 'Period(s)'}
                  </span>
                </div>
              </div>
            </div>

            {scheduleFrequency === 'weekly' && (
              <div className="mb-4">
                <label htmlFor="day-of-week" className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  id="day-of-week"
                  value={scheduleDayOfWeek}
                  onChange={handleDayOfWeekChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            )}

            {scheduleFrequency === 'monthly' && (
              <div className="mb-4">
                <label htmlFor="day-of-month" className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Month
                </label>
                <select
                  id="day-of-month"
                  value={scheduleDayOfMonth}
                  onChange={handleDayOfMonthChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={handleTimeChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Schedule Summary:</span> {getScheduleDescription({
                  frequency: scheduleFrequency,
                  dayOfWeek: scheduleDayOfWeek,
                  dayOfMonth: scheduleDayOfMonth,
                  time: scheduleTime,
                  repeatEvery: scheduleRepeatEvery
                })}
              </p>
            </div>
          </div>
        )}

        {/* Add Button */}
        <div>
          <button
            onClick={handleAddActivity}
            disabled={!selectedSite || !selectedArea || !customQuestion.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Activity
          </button>
        </div>

        {/* Activity List */}
        {activities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Activity List</h3>
            <div className="border rounded-md divide-y">
              {activities.map(activity => {
                const site = mockSites.find(s => s.id === activity.siteId)?.name;
                return (
                  <div key={activity.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${activity.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div className="text-sm font-medium">{site} - {activity.area}</div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{activity.question}</div>
                        <div className="text-xs text-indigo-600 mt-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {getScheduleDescription(activity.schedule)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActivity(activity.id)}
                          className={`text-sm px-2 py-1 rounded ${activity.enabled ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {activity.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleRemoveActivity(activity.id)}
                          className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSaveActivities}
            disabled={activities.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Activity List
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigureActivityList;
