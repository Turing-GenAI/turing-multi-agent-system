import React, { useState } from 'react';

interface InputHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  inputType: 'Agent Prompt' | 'Activity' | 'Schedule' | 'Other';
  content: string;
  status: 'completed' | 'failed' | 'pending';
  details?: {
    section?: string;
    actionType?: string;
    relatedItems?: string[];
  };
}

const mockHistoryData: InputHistoryEntry[] = [
  {
    id: 'entry1',
    timestamp: '2025-03-10T14:30:00',
    user: 'John Doe',
    inputType: 'Agent Prompt',
    content: 'Updated agent prompt for data analysis',
    status: 'completed',
    details: {
      section: 'Agent Prompts',
      actionType: 'Update',
      relatedItems: ['Data Analysis Agent']
    }
  },
  {
    id: 'entry2',
    timestamp: '2025-03-10T13:45:00',
    user: 'Jane Smith',
    inputType: 'Activity',
    content: 'Added new inspection activities for Site A',
    status: 'completed',
    details: {
      section: 'Configure Activities',
      actionType: 'Create',
      relatedItems: ['Site A', 'Quality Control', 'Safety Inspection']
    }
  },
  {
    id: 'entry3',
    timestamp: '2025-03-10T11:20:00',
    user: 'John Doe',
    inputType: 'Schedule',
    content: 'Set up monthly safety audit schedule',
    status: 'completed',
    details: {
      section: 'Configure Schedule',
      actionType: 'Create',
      relatedItems: ['Monthly', 'Day 15', '09:00 AM']
    }
  },
  {
    id: 'entry4',
    timestamp: '2025-03-09T16:15:00',
    user: 'Alice Johnson',
    inputType: 'Activity',
    content: 'Modified inspection activities for regulatory compliance',
    status: 'completed',
    details: {
      section: 'Configure Activities',
      actionType: 'Update',
      relatedItems: ['Regulatory', 'Compliance', 'Documentation Review']
    }
  },
  {
    id: 'entry5',
    timestamp: '2025-03-09T10:50:00',
    user: 'Bob Williams',
    inputType: 'Schedule',
    content: 'Updated weekly data quality check schedule',
    status: 'pending',
    details: {
      section: 'Configure Schedule',
      actionType: 'Update',
      relatedItems: ['Weekly', 'Friday', '14:00 PM']
    }
  },
  {
    id: 'entry6',
    timestamp: '2025-03-08T09:30:00',
    user: 'Jane Smith',
    inputType: 'Agent Prompt',
    content: 'Refined agent prompt for safety monitoring',
    status: 'failed',
    details: {
      section: 'Agent Prompts',
      actionType: 'Update',
      relatedItems: ['Safety Monitor Agent']
    }
  }
];

const InputHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<InputHistoryEntry | null>(null);

  const historyEntries = mockHistoryData;

  // Get unique users for filter dropdown
  const uniqueUsers = Array.from(new Set(historyEntries.map(entry => entry.user)));
  
  // Get unique input types for filter dropdown
  const uniqueTypes = Array.from(new Set(historyEntries.map(entry => entry.inputType)));

  // Filter entries based on search term and filters
  const filteredEntries = historyEntries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesUser = filterUser === 'all' || entry.user === filterUser;
    const matchesType = filterType === 'all' || entry.inputType === filterType;
    
    return matchesSearch && matchesStatus && matchesUser && matchesType;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterUser('all');
    setFilterType('all');
  };

  const handleViewDetails = (entry: InputHistoryEntry) => {
    setSelectedEntry(entry);
  };

  const handleCloseDetails = () => {
    setSelectedEntry(null);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Get color based on input type
  const getTypeColor = (type: string): string => {
    switch(type) {
      case 'Agent Prompt':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Activity':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Schedule':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get color based on status
  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Input History</h2>
      
      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-4">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by content or user..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">
            User
          </label>
          <select
            id="user-filter"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Input Type
          </label>
          <select
            id="type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* History List */}
      <div className="flex-grow overflow-y-auto border border-gray-200 rounded-md">
        {filteredEntries.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredEntries.map(entry => (
              <li 
                key={entry.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleViewDetails(entry)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full shadow-sm border ${getTypeColor(entry.inputType)} mr-2`}>
                        {entry.inputType}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full shadow-sm border ${getStatusColor(entry.status)}`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{entry.content}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{entry.user}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(entry);
                      }}
                      className="text-sm text-yellow-600 hover:text-yellow-800 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">No history entries found matching your filters.</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Input Details</h3>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full shadow-sm border ${getTypeColor(selectedEntry.inputType)} mr-2`}>
                    {selectedEntry.inputType}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full shadow-sm border ${getStatusColor(selectedEntry.status)}`}>
                    {selectedEntry.status.charAt(0).toUpperCase() + selectedEntry.status.slice(1)}
                  </span>
                </div>
                
                <h4 className="text-xl font-medium text-gray-800 mb-2">{selectedEntry.content}</h4>
                
                <div className="flex items-center text-sm text-gray-500 mb-6">
                  <span>{selectedEntry.user}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(selectedEntry.timestamp)}</span>
                </div>
                
                {selectedEntry.details && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-700 mb-2">Additional Details</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEntry.details.section && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Section</p>
                          <p className="text-sm text-gray-800">{selectedEntry.details.section}</p>
                        </div>
                      )}
                      
                      {selectedEntry.details.actionType && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Action Type</p>
                          <p className="text-sm text-gray-800">{selectedEntry.details.actionType}</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedEntry.details.relatedItems && selectedEntry.details.relatedItems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Related Items</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedEntry.details.relatedItems.map((item, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md border border-gray-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputHistory;
