import React, { useState, useEffect } from 'react';

interface Schedule {
  frequency: 'monthly' | 'quarterly' | 'biannually' | 'custom';
  dayOfMonth?: number; // 1-31
  months?: number[]; // Array of months (1-12)
  time: string; // HH:MM format
  enabled: boolean;
}

const STORAGE_KEY = 'turing-audit-copilot-schedule';

const ConfigureSchedule: React.FC = () => {
  // Scheduling states
  const [schedule, setSchedule] = useState<Schedule>({
    frequency: 'monthly',
    dayOfMonth: 1,
    months: Array.from({length: 12}, (_, i) => i + 1), // Default for monthly
    time: '09:00',
    enabled: false
  });
  
  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Load saved schedule from localStorage on component mount
  useEffect(() => {
    const savedSchedule = localStorage.getItem(STORAGE_KEY);
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
      } catch (error) {
        console.error('Error loading saved schedule:', error);
      }
    }
  }, []);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as 'monthly' | 'quarterly' | 'biannually' | 'custom';
    
    // Set default months for each frequency
    let months: number[] = [];
    switch (frequency) {
      case 'quarterly':
        months = [1, 4, 7, 10];
        break;
      case 'biannually':
        months = [1, 7];
        break;
      case 'monthly':
        months = Array.from({length: 12}, (_, i) => i + 1);
        break;
      default:
        months = [];
    }
    
    setSchedule({
      ...schedule,
      frequency,
      months
    });
  };

  const handleDayOfMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSchedule({
      ...schedule,
      dayOfMonth: parseInt(e.target.value)
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchedule({
      ...schedule,
      time: e.target.value
    });
  };

  const handleToggleEnabled = () => {
    setSchedule({
      ...schedule,
      enabled: !schedule.enabled
    });
  };

  const handleSaveSchedule = () => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    
    // Show success notification
    setNotification({
      show: true,
      message: 'Schedule saved successfully!',
      type: 'success'
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const getScheduleDescription = (): string => {
    let description = '';
    
    switch (schedule.frequency) {
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth || 1;
        description = `Every month on day ${dayOfMonth}`;
        break;
      case 'quarterly':
        description = 'Every quarter (Jan, Apr, Jul, Oct)';
        break;
      case 'biannually':
        description = 'Every 6 months (Jan, Jul)';
        break;
      case 'custom':
        description = 'Custom schedule';
        break;
    }
    
    return `${description} at ${schedule.time}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Configure Audit Copilot Schedule</h2>
      <p className="text-gray-600 mb-6">
        Set up when the Audit Copilot should run automatically
      </p>

      {/* Improved Toast Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slideIn">
          <div 
            className={`
              shadow-lg rounded-lg border border-l-4 px-4 py-3 flex items-center justify-between
              ${notification.type === 'success' 
                ? 'bg-white border-purple-500 text-purple-800' 
                : notification.type === 'error' 
                ? 'bg-white border-red-500 text-red-800' 
                : 'bg-white border-blue-500 text-blue-800'
              }
            `}
          >
            <div className="flex items-center">
              {notification.type === 'success' && (
                <div className="rounded-full bg-purple-100 p-1 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {notification.type === 'error' && (
                <div className="rounded-full bg-red-100 p-1 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {notification.type === 'info' && (
                <div className="rounded-full bg-blue-100 p-1 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div>
                <p className="font-medium">
                  {notification.type === 'success' ? 'Success!' : notification.type === 'error' ? 'Error!' : 'Information'}
                </p>
                <p className="text-sm">{notification.message}</p>
              </div>
            </div>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center mb-6">
          <div className="mr-3">
            <span className="text-sm font-medium text-gray-700">
              Scheduled Execution:
            </span>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
              schedule.enabled ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                schedule.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-2 text-sm text-gray-600">
            {schedule.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <label htmlFor="frequency-select" className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              id="frequency-select"
              value={schedule.frequency}
              onChange={handleFrequencyChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="monthly">Every Month</option>
              <option value="quarterly">Every Quarter</option>
              <option value="biannually">Every 6 Months</option>
              <option value="custom">Custom Schedule</option>
            </select>
          </div>

          <div>
            <label htmlFor="day-of-month" className="block text-sm font-medium text-gray-700 mb-1">
              Day of Month
            </label>
            <select
              id="day-of-month"
              value={schedule.dayOfMonth}
              onChange={handleDayOfMonthChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              id="schedule-time"
              type="time"
              value={schedule.time}
              onChange={handleTimeChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-4">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Schedule Summary</h3>
          <p className="text-sm text-purple-800">
            {schedule.enabled 
              ? `The Audit Copilot will run ${getScheduleDescription()}`
              : 'The Audit Copilot is not scheduled to run automatically'
            }
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveSchedule}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigureSchedule;
