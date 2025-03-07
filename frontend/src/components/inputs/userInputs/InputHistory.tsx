import React, { useState } from 'react';

interface InputHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  inputType: string;
  content: string;
  status: 'completed' | 'failed' | 'pending';
}

const InputHistory: React.FC = () => {
  // Mock data for input history
  const [historyEntries, setHistoryEntries] = useState<InputHistoryEntry[]>([
    {
      id: 'entry1',
      timestamp: '2025-03-07T08:30:00',
      user: 'John Doe',
      inputType: 'Question',
      content: 'What are the key findings from clinical trial CT-2023-001?',
      status: 'completed'
    },
    {
      id: 'entry2',
      timestamp: '2025-03-06T14:45:00',
      user: 'Jane Smith',
      inputType: 'Query',
      content: 'Compare efficacy results between Site 1 and Site 2',
      status: 'completed'
    },
    {
      id: 'entry3',
      timestamp: '2025-03-05T11:20:00',
      user: 'John Doe',
      inputType: 'Activity',
      content: 'Monthly safety report for Drug X',
      status: 'failed'
    },
    {
      id: 'entry4',
      timestamp: '2025-03-04T09:15:00',
      user: 'Alice Johnson',
      inputType: 'Question',
      content: 'What are the inclusion criteria for the upcoming trial?',
      status: 'completed'
    },
    {
      id: 'entry5',
      timestamp: '2025-03-03T16:50:00',
      user: 'Bob Williams',
      inputType: 'Activity',
      content: 'Weekly data quality check',
      status: 'pending'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<InputHistoryEntry | null>(null);

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Input History</h2>
      <p className="text-gray-600 mb-6">
        View and manage the history of user inputs, including questions, queries, and scheduled activities.
      </p>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="flex-1 mb-2 md:mb-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by content or user..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No matching entries found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(entry.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.inputType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {entry.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(entry.status)}`}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(entry)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Input Details</h3>
              <button 
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ID</p>
                  <p className="text-sm font-mono">{selectedEntry.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Timestamp</p>
                  <p className="text-sm">{formatDate(selectedEntry.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User</p>
                  <p className="text-sm">{selectedEntry.user}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-sm">{selectedEntry.inputType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedEntry.status)}`}>
                    {selectedEntry.status.charAt(0).toUpperCase() + selectedEntry.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Content</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{selectedEntry.content}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                {selectedEntry.status === 'failed' && (
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-blue-700">
              This history shows all user inputs processed by the system. You can filter and search to find specific entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputHistory;
