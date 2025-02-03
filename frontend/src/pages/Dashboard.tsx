import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';
import { ActionItems } from '../components/dashboard/ActionItems';

// Mock data - Replace with actual data from your backend
const mockStats = {
  totalDeviations: 156,
  openActions: 23,
  criticalFindings: 8,
  completedActions: 45,
};

const mockActivities = [
  {
    id: '1',
    title: 'New Critical Finding Detected',
    description: 'Temperature deviation in Storage Unit A exceeds threshold',
    timestamp: new Date('2025-01-24T06:30:00'),
    type: 'finding',
    status: 'Critical',
  },
  {
    id: '2',
    title: 'Action Item Completed',
    description: 'Documentation update for Protocol XYZ-123',
    timestamp: new Date('2025-01-24T05:45:00'),
    type: 'action',
    status: 'Completed',
  },
  {
    id: '3',
    title: 'New Deviation Reported',
    description: 'Missing signature in Form ABC-789',
    timestamp: new Date('2025-01-24T04:15:00'),
    type: 'deviation',
  },
];

const mockActions = [
  {
    id: '1',
    title: 'Review Temperature Logs',
    description: 'Analyze temperature deviation patterns in Storage Unit A',
    priority: 'high',
    dueDate: new Date('2025-01-26'),
    status: 'pending',
  },
  {
    id: '2',
    title: 'Update SOP Documentation',
    description: 'Incorporate new safety protocols into SOP-123',
    priority: 'medium',
    dueDate: new Date('2025-01-28'),
    status: 'in_progress',
  },
  {
    id: '3',
    title: 'Training Session',
    description: 'Conduct training on updated documentation procedures',
    priority: 'low',
    dueDate: new Date('2025-01-30'),
    status: 'completed',
  },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <Link 
          to="/audit" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Audit Trial
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Deviations"
          value={mockStats.totalDeviations}
          icon={AlertTriangle}
          trend={{ value: 12, isPositive: false }}
        />
        <StatCard
          title="Open Actions"
          value={mockStats.openActions}
          icon={Clock}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Critical Findings"
          value={mockStats.criticalFindings}
          icon={AlertCircle}
          trend={{ value: 2, isPositive: false }}
        />
        <StatCard
          title="Completed Actions"
          value={mockStats.completedActions}
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Column */}
        <div className="lg:col-span-2">
          <ActivityTimeline activities={mockActivities} />
        </div>

        {/* Action Items Column */}
        <div>
          <ActionItems actions={mockActions} />
        </div>
      </div>
    </div>
  );
};
