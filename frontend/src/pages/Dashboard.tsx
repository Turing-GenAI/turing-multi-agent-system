import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, AlertCircle, Clock, FileCheck, FileWarning, BarChart2 } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';
import { ActionItems } from '../components/dashboard/ActionItems';
import { TimelineCard } from '../components/dashboard/TimelineCard';

// Import the Activity type to ensure type consistency
interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'finding' | 'action' | 'deviation';
  status?: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

// Mock data - Replace with actual data from your backend
const mockStats = {
  totalDeviations: 156,
  openActions: 23,
  criticalFindings: 8,
  completedActions: 45,
};

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Protocol Deviation alert for Trial #28745',
    description: '3 protocol deviations were not closed in an acceptable time frame.',
    timestamp: new Date(),
    type: 'deviation',
    status: 'Open',
  },
  {
    id: '2',
    title: 'Adverse Event alert for Trial #35912',
    description: '2 adverse events were reported with delay.',
    timestamp: new Date(),
    type: 'finding',
    status: 'Open',
  },
  {
    id: '3',
    title: 'Informed Consent alert for Trial #47231',
    description: 'Some patients have not consented for the applicable ICF version',
    timestamp: new Date(),
    type: 'deviation',
    status: 'Open',
  },
];

const mockActions: ActionItem[] = [
  {
    id: '1',
    title: 'Close Protocol Deviations for Trial #28745',
    description: 'Review and close 3 protocol deviations that have exceeded acceptable timeframe',
    priority: 'high',
    dueDate: new Date('2025-03-12'),
    status: 'pending',
  },
  {
    id: '2',
    title: 'Investigate Adverse Event Reporting Delays for Trial #35912',
    description: 'Determine root cause of delayed reporting for 2 adverse events and implement corrective measures',
    priority: 'high',
    dueDate: new Date('2025-03-11'),
    status: 'in_progress',
  },
  {
    id: '3',
    title: 'Update ICF Consents for Trial #47231',
    description: 'Ensure all patients complete consent for the latest ICF version and document appropriately',
    priority: 'medium',
    dueDate: new Date('2025-03-15'),
    status: 'pending',
  },
];

export const Dashboard: React.FC = () => {
  // Set to false to temporarily hide the overview section
  const showOverview = false;
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Overview section - temporarily hidden via conditional rendering */}
      {showOverview && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            {/* <Link 
              to="/audit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Audit Trial
            </Link> */}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Deviations"
              value={mockStats.totalDeviations}
              icon={BarChart2}
              trend={{ value: 12, isPositive: false }}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Open Alerts"
              value={mockStats.openActions}
              icon={AlertCircle}
              trend={{ value: 5, isPositive: true }}
              bgColor="bg-yellow-50"
              iconColor="text-yellow-600"
            />
            <StatCard
              title="Critical Findings"
              value={mockStats.criticalFindings}
              icon={AlertCircle}
              trend={{ value: 2, isPositive: false }}
              bgColor="bg-red-50"
              iconColor="text-red-600"
            />
            <StatCard
              title="Completed Alerts"
              value={mockStats.completedActions}
              icon={CheckCircle2}
              trend={{ value: 8, isPositive: true }}
              bgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>
        </>
      )}

      {/* Clinical Trials Timeline */}
      <div className="mb-6">
        <TimelineCard />
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
