import React, { useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
}

// Mock data for inspection areas
const mockInspectionAreas: Site[] = [
  {
    id: 'area1',
    name: 'Protocol Compliance'
  },
  {
    id: 'area2',
    name: 'Data Integrity'
  },
  {
    id: 'area3',
    name: 'Subject Safety'
  }
];

// Mock activities for each inspection area
const mockActivities: Activity[] = [
  // Protocol Compliance activities
  {
    id: 'activity-pc-1',
    inspectionAreaId: 'area1',
    description: 'Verify informed consent documentation is complete and properly executed',
    enabled: true
  },
  {
    id: 'activity-pc-2',
    inspectionAreaId: 'area1',
    description: 'Audit protocol deviation documentation and reporting',
    enabled: true
  },
  {
    id: 'activity-pc-3',
    inspectionAreaId: 'area1',
    description: 'Review investigator qualifications and training records',
    enabled: true
  },
  {
    id: 'activity-pc-4',
    inspectionAreaId: 'area1',
    description: 'Assess adherence to inclusion/exclusion criteria',
    enabled: true
  },
  
  // Data Integrity activities
  {
    id: 'activity-di-1',
    inspectionAreaId: 'area2',
    description: 'Verify source data against CRF entries for accuracy',
    enabled: true
  },
  {
    id: 'activity-di-2',
    inspectionAreaId: 'area2',
    description: 'Review data correction procedures and audit trails',
    enabled: true
  },
  {
    id: 'activity-di-3',
    inspectionAreaId: 'area2',
    description: 'Audit electronic data capture system access controls',
    enabled: true
  },
  {
    id: 'activity-di-4',
    inspectionAreaId: 'area2',
    description: 'Evaluate data query resolution process and timelines',
    enabled: true
  },
  
  // Subject Safety activities
  {
    id: 'activity-ss-1',
    inspectionAreaId: 'area3',
    description: 'Review adverse event reporting procedures and timelines',
    enabled: true
  },
  {
    id: 'activity-ss-2',
    inspectionAreaId: 'area3',
    description: 'Audit safety monitoring documentation and follow-up',
    enabled: true
  },
  {
    id: 'activity-ss-3',
    inspectionAreaId: 'area3',
    description: 'Verify proper documentation of concomitant medications',
    enabled: true
  },
  {
    id: 'activity-ss-4',
    inspectionAreaId: 'area3',
    description: 'Assess protocol-specific safety parameter monitoring compliance',
    enabled: true
  }
];

interface Activity {
  id: string;
  inspectionAreaId: string;
  description: string;
  enabled: boolean;
}

interface ConfigureActivitiesProps {
  savedActivities?: Activity[]; // Add this prop to accept saved activities from parent
  onSave?: (activities: Activity[]) => void;
  onChange?: () => void;
}

const STORAGE_KEY = 'configuredActivities';
const savedActivities = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error parsing saved activities:', error);
    return null;
  }
})();

const ConfigureActivities: React.FC<ConfigureActivitiesProps> = ({ savedActivities, onSave, onChange }) => {
  const [inspectionAreas, setInspectionAreas] = useState<Site[]>(mockInspectionAreas);
  const [selectedInspectionArea, setSelectedInspectionArea] = useState<string>(mockInspectionAreas[0]?.id || '');
  const [newInspectionAreaName, setNewInspectionAreaName] = useState<string>('');
  const [showNewInspectionAreaInput, setShowNewInspectionAreaInput] = useState<boolean>(false);
  const [activityList, setActivityList] = useState<string>('');
  
  // Initialize with mock activities if no saved activities exist
  const initialActivities = savedActivities && savedActivities.length > 0 ? savedActivities : mockActivities;
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  
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
  
  // Activity list management states
  const [activitiesPerPage, setActivitiesPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>('');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});

  // Clear any existing saved activities to ensure mock activities are shown
  useEffect(() => {
    // Remove any saved activities from localStorage to ensure mock activities are shown by default
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Load saved activities from localStorage on component mount
  useEffect(() => {
    if (!savedActivities) {
      const savedActivitiesString = localStorage.getItem(STORAGE_KEY);
      if (savedActivitiesString) {
        try {
          const loadedActivities = JSON.parse(savedActivitiesString);
          // Only use saved activities if they exist and aren't empty
          if (loadedActivities && loadedActivities.length > 0) {
            setActivities(loadedActivities);
          }
        } catch (error) {
          console.error('Error loading saved activities:', error);
        }
      }
    }
  }, [savedActivities]);

  const handleInspectionAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const inspectionAreaId = e.target.value;
    if (inspectionAreaId === 'new') {
      setShowNewInspectionAreaInput(true);
      setSelectedInspectionArea('');
    } else {
      setShowNewInspectionAreaInput(false);
      setSelectedInspectionArea(inspectionAreaId);
    }
  };

  const handleNewInspectionAreaNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewInspectionAreaName(e.target.value);
  };

  const handleAddNewInspectionArea = () => {
    if (newInspectionAreaName.trim()) {
      const newId = `area-${Date.now()}`;
      // Update mockInspectionAreas (in a real app, this would be an API call)
      mockInspectionAreas.push({
        id: newId,
        name: newInspectionAreaName.trim()
      });
      setSelectedInspectionArea(newId);
      setShowNewInspectionAreaInput(false);
      setNewInspectionAreaName('');
    }
  };

  const handleActivityListChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setActivityList(e.target.value);
  };

  const handleAddActivity = () => {
    if (selectedInspectionArea && activityList.trim()) {
      // Split the activity list by new lines to create multiple activities
      const activityDescriptions = activityList
        .split('\n')
        .filter(line => line.trim().length > 0);
      
      if (activityDescriptions.length === 0) return;
      
      const newActivities = activityDescriptions.map(description => ({
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        inspectionAreaId: selectedInspectionArea,
        description: description.trim(),
        enabled: true
      }));
      
      const updatedActivities = [...activities, ...newActivities];
      setActivities(updatedActivities);
      
      // Notify parent component of changes
      if (onChange) {
        onChange();
      }
      
      setActivityList(''); // Clear the activity list input
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

  const handleClearAllActivities = () => {
    // Clear all activities
    setActivities([]);
    
    // Notify parent component of changes
    if (onChange) {
      onChange();
    }
    
    // Show success notification
    setNotification({
      show: true,
      message: 'All activities have been cleared!',
      type: 'info'
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification((prev: {show: boolean, message: string, type: 'success' | 'error' | 'info'}) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleSaveActivities = () => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    
    // Call the onSave callback if provided
    if (onSave) {
      onSave(activities);
    }
    
    // Show success notification instead of alert
    setNotification({
      show: true,
      message: 'Activity list saved successfully!',
      type: 'success'
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification((prev: {show: boolean, message: string, type: 'success' | 'error' | 'info'}) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Group activities by inspection area
  const groupActivitiesByArea = () => {
    const groups: {[key: string]: Activity[]} = {};
    
    activities.forEach(activity => {
      const areaId = activity.inspectionAreaId;
      if (!groups[areaId]) {
        groups[areaId] = [];
        // Initialize expanded state if not already set
        if (expandedGroups[areaId] === undefined) {
          setExpandedGroups((prev: {[key: string]: boolean}) => ({ ...prev, [areaId]: true }));
        }
      }
      groups[areaId].push(activity);
    });
    
    return groups;
  };
  
  // Filter activities based on search text and filters
  const getFilteredActivities = () => {
    return activities.filter(activity => {
      const area = mockInspectionAreas.find(a => a.id === activity.inspectionAreaId);
      const matchesText = filterText === '' || 
        activity.description.toLowerCase().includes(filterText.toLowerCase()) ||
        (area && area.name.toLowerCase().includes(filterText.toLowerCase()));
      
      const matchesArea = filterArea === 'all' || activity.inspectionAreaId === filterArea;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'enabled' && activity.enabled) || 
        (filterStatus === 'disabled' && !activity.enabled);
      
      return matchesText && matchesArea && matchesStatus;
    });
  };
  
  // Calculate pagination
  const filteredActivities = getFilteredActivities();
  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * activitiesPerPage, 
    currentPage * activitiesPerPage
  );
  
  // Toggle group expansion
  const toggleGroup = (areaId: string) => {
    setExpandedGroups((prev: {[key: string]: boolean}) => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterArea, filterStatus]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Configure Activities</h2>
      <p className="text-gray-600 mb-6">
        Choose an inspection area and enter the activities to be carried out by the agent
      </p>

      {/* Improved Toast Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slideIn">
          <div 
            className={`
              shadow-lg rounded-lg border border-l-4 px-4 py-3 flex items-center justify-between
              ${notification.type === 'success' 
                ? 'bg-white border-green-500 text-green-800' 
                : notification.type === 'error' 
                ? 'bg-white border-red-500 text-red-800' 
                : 'bg-white border-blue-500 text-blue-800'
              }
            `}
          >
            <div className="flex items-center">
              {notification.type === 'success' && (
                <div className="rounded-full bg-green-100 p-1 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {notification.type === 'error' && (
                <div className="rounded-full bg-red-100 p-1 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
        {/* Inspection Area Selection */}
        <div>
          <label htmlFor="inspection-area-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Inspection Area
          </label>
          <select
            id="inspection-area-select"
            value={selectedInspectionArea}
            onChange={handleInspectionAreaChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select an Inspection Area --</option>
            {mockInspectionAreas.map(area => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
            <option value="new">+ Define New Inspection Area</option>
          </select>
        </div>

        {/* New Inspection Area Input */}
        {showNewInspectionAreaInput && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={newInspectionAreaName}
              onChange={handleNewInspectionAreaNameChange}
              placeholder="Enter new inspection area name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddNewInspectionArea}
              disabled={!newInspectionAreaName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        )}

        {/* Activity List Input */}
        <div>
          <label htmlFor="activity-list" className="block text-sm font-medium text-gray-700 mb-1">
            List of Activities
          </label>
          <textarea
            id="activity-list"
            value={activityList}
            onChange={handleActivityListChange}
            placeholder="Enter activities, one per line..."
            rows={5}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedInspectionArea}
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">Enter each activity on a new line</p>
        </div>

        {/* Add Activity Button */}
        <div className="flex justify-start items-center">
          <button
            onClick={handleAddActivity}
            disabled={!selectedInspectionArea || !activityList.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Add Activity
          </button>
        </div>

        {/* Activity List */}
        {activities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Activity List</h3>
            
            {/* Filtering and search controls */}
            <div className="bg-gray-50 p-3 rounded-md mb-3 border border-gray-200 shadow-sm">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search activities..."
                    value={filterText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
                  />
                </div>
                
                <div>
                  <select
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterArea}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterArea(e.target.value)}
                  >
                    <option value="all">All Areas</option>
                    {mockInspectionAreas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>
            
            {filteredActivities.length > 0 ? (
              <>
                {/* Display mode: Grouped by area */}
                {filterArea === 'all' && filterText === '' && filterStatus === 'all' ? (
                  <div className="border rounded-md divide-y shadow-sm">
                    {Object.entries(groupActivitiesByArea()).map(([areaId, areaActivities]) => {
                      const area = mockInspectionAreas.find(a => a.id === areaId)?.name || 'Unknown Area';
                      return (
                        <div key={areaId} className="bg-white">
                          <div 
                            className="p-3 bg-gray-50 cursor-pointer flex justify-between items-center" 
                            onClick={() => toggleGroup(areaId)}
                          >
                            <div className="font-medium flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 mr-2 transition-transform ${expandedGroups[areaId] ? 'transform rotate-90' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {area} <span className="text-gray-500 ml-2">({areaActivities.length})</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {expandedGroups[areaId] ? 'Collapse' : 'Expand'}
                            </div>
                          </div>
                          
                          {expandedGroups[areaId] && (
                            <div className="divide-y">
                              {areaActivities.map(activity => (
                                <div key={activity.id} className="p-3 pl-8">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${activity.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <div className="text-sm font-medium">{activity.description}</div>
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
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Display mode: Filtered/Paginated list */
                  <div className="border rounded-md divide-y shadow-sm">
                    {paginatedActivities.map(activity => {
                      const area = mockInspectionAreas.find(a => a.id === activity.inspectionAreaId)?.name;
                      return (
                        <div key={activity.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${activity.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <div className="text-sm font-medium">{area}</div>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
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
                )}
                
                {/* Pagination controls - Only show when needed */}
                {totalPages > 1 && (
                  <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
                    <div className="text-sm text-gray-600 flex items-center">
                      <span>
                        Showing {(currentPage - 1) * activitiesPerPage + 1} to {Math.min(currentPage * activitiesPerPage, filteredActivities.length)} of {filteredActivities.length} activities
                      </span>
                      <div className="ml-4 flex items-center">
                        <label htmlFor="activities-per-page" className="text-sm text-gray-600 mr-2">
                          Per page:
                        </label>
                        <select
                          id="activities-per-page"
                          value={activitiesPerPage}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setActivitiesPerPage(Number(e.target.value));
                            setCurrentPage(1); // Reset to first page when changing items per page
                          }}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Calculate page numbers to show (centered around current page)
                        const pageOffset = Math.max(0, Math.min(totalPages - 5, currentPage - 3));
                        const pageNum = i + 1 + pageOffset;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 text-sm ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            } rounded`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 border rounded-md bg-gray-50 shadow-sm">
                <p className="text-gray-500">No activities match your search criteria</p>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveActivities}
            disabled={activities.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Activities
          </button>
          <button
            onClick={handleClearAllActivities}
            disabled={activities.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigureActivities;
