import React, { useState } from 'react';
import { FiRefreshCw, FiUpload, FiFileText } from 'react-icons/fi';

interface ComplianceData {
  category: string;
  percentage: number;
}

interface ActivityLogItem {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  project: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedSubmissionType, setSelectedSubmissionType] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Mock data for demonstration
  const complianceData: ComplianceData[] = [
    { category: 'Labeling', percentage: 85 },
    { category: 'Clinical', percentage: 92 },
    { category: 'Manufacturing', percentage: 78 },
  ];

  const activityLog: ActivityLogItem[] = [
    {
      id: '1',
      user: 'John Doe',
      action: 'Updated clinical documentation',
      timestamp: new Date('2024-03-20T10:30:00'),
      project: 'Project A'
    },
    {
      id: '2',
      user: 'Jane Smith',
      action: 'Completed compliance review',
      timestamp: new Date('2024-03-20T09:15:00'),
      project: 'Project B'
    },
  ];

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <input
              type="date"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              <option value="projectA">Project A</option>
              <option value="projectB">Project B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submission Type</label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={selectedSubmissionType}
              onChange={(e) => setSelectedSubmissionType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="510k">510(k)</option>
              <option value="pma">PMA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">All Teams</option>
              <option value="clinical">Clinical</option>
              <option value="regulatory">Regulatory</option>
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FiRefreshCw className="w-4 h-4" />
            Run Compliance Check
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <FiUpload className="w-4 h-4" />
            Upload Document
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            <FiFileText className="w-4 h-4" />
            View Report
          </button>
        </div>

        {/* Compliance Percentage Bars */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {complianceData.map((item) => (
            <div key={item.category} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{item.category}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getStatusColor(item.percentage)}`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activityLog.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.project}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {activity.timestamp.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 