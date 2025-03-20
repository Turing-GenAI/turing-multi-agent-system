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
    title: 'Protocol Deviation alert for Trial CNTO1275AMY3001',
    description: '3 protocol deviations were identified during the audit process.',
    timestamp: new Date(),
    type: 'deviation',
    status: 'In Progress',
  },
  {
    id: '2',
    title: 'Adverse Event alert for Trial VAC18193RSV2028',
    description: '2 adverse events require additional follow-up actions.',
    timestamp: new Date(),
    type: 'finding',
    status: 'In Progress',
  },
  {
    id: '3',
    title: 'Informed Consent alert for Trial 90014496PUC3103',
    description: 'Some patients have missing documentation in the audit trail',
    timestamp: new Date(),
    type: 'deviation',
    status: 'In Progress',
  },
];

const mockActions: ActionItem[] = [
  {
    id: '1',
    title: 'Review Protocol Deviations for Trial CNTO1275AMY3001',
    description: 'Audit 3 protocol deviations that were identified in the initial review',
    priority: 'high',
    dueDate: new Date('2025-03-22'),
    status: 'pending',
  },
  {
    id: '2',
    title: 'Follow Up on Adverse Events for Trial VAC18193RSV2028',
    description: 'Complete audit process for 2 adverse events and document findings',
    priority: 'high',
    dueDate: new Date('2025-03-21'),
    status: 'in_progress',
  },
  {
    id: '3',
    title: 'Audit Informed Consent Forms for Trial 90014496PUC3103',
    description: 'Verify documentation completeness for all patient consent forms',
    priority: 'medium',
    dueDate: new Date('2025-03-25'),
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
              title="Total Findings"
              value={mockStats.totalDeviations}
              icon={BarChart2}
              trend={{ value: 12, isPositive: false }}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="In Progress Alerts"
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
              title="Audited Alerts"
              value={mockStats.completedActions}
              icon={CheckCircle2}
              trend={{ value: 8, isPositive: true }}
              bgColor="bg-green-50"
              iconColor="text-green-600"
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
