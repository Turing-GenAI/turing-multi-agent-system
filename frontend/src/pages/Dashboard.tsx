import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileCheck, 
  FileWarning, 
  BarChart2,
  Activity,
  AlertOctagon,
  CheckCircle,
  FileText,
  Play,
  Search,
  Bot
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';
import { ActionItems } from '../components/dashboard/ActionItems';
import { TimelineCard } from '../components/dashboard/TimelineCard';
import { ReadinessScorecard } from '../components/dashboard/ReadinessScorecard';
import { OngoingAudits } from '../components/dashboard/OngoingAudits';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { HighPriorityFindings } from '../components/dashboard/HighPriorityFindings';
import { QuickActions } from '../components/dashboard/QuickActions';

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
    title: 'Domain 1 (D1) alert for Trial CNTO1275AMY3001',
    description: '3 D1 alerts were identified during the audit process.',
    timestamp: new Date(),
    type: 'deviation',
    status: 'In Progress',
  },
  {
    id: '2',
    title: 'Domain 2 (D2) alert for Trial VAC18193RSV2028',
    description: '2 D2 alerts require additional follow-up actions.',
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
    title: 'Review D1 Alerts for Trial CNTO1275AMY3001',
    description: 'Audit 3 D1 alerts that were identified in the initial review',
    priority: 'high',
    dueDate: new Date('2025-03-22'),
    status: 'pending',
  },
  {
    id: '2',
    title: 'Follow Up on D2 Alerts for Trial VAC18193RSV2028',
    description: 'Complete audit process for 2 D2 alerts and document findings',
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

const mockReadinessItems = [
  { id: '1', name: 'Site A', readiness: 85, status: 'ready' as const },
  { id: '2', name: 'Site B', readiness: 65, status: 'review' as const },
  { id: '3', name: 'Site C', readiness: 45, status: 'critical' as const },
];

const mockAudits = [
  {
    id: '1',
    name: 'Protocol Compliance Audit',
    site: 'Site A',
    progress: 75,
    nextSteps: 'Review findings from Protocol Deviation Agent',
    dueDate: new Date('2024-04-15'),
  },
  {
    id: '2',
    name: 'Informed Consent Review',
    site: 'Site B',
    progress: 30,
    nextSteps: 'Complete document collection',
    dueDate: new Date('2024-04-20'),
  },
];

const mockQuickActions = [
  {
    id: '1',
    title: 'Run New Audit',
    icon: <Play className="h-5 w-5" />,
    link: '/audit/new',
    description: 'Start a new compliance audit',
  },
  {
    id: '2',
    title: 'Simulate Inspection',
    icon: <Search className="h-5 w-5" />,
    link: '/simulate',
    description: 'Run a mock FDA inspection',
  },
  {
    id: '3',
    title: 'Generate Report',
    icon: <FileText className="h-5 w-5" />,
    link: '/reports/new',
    description: 'Create a compliance report',
  },
  {
    id: '4',
    title: 'Add Agent',
    icon: <Bot className="h-5 w-5" />,
    link: '/agents/new',
    description: 'Configure a new audit agent',
  },
];

const mockFindings = [
  {
    id: '1',
    title: 'Missing Protocol Amendment Documentation',
    site: 'Site A',
    agent: 'Protocol Deviation Agent',
    severity: 'high' as const,
    tags: ['Protocol', 'Documentation'],
  },
  {
    id: '2',
    title: 'Incomplete Informed Consent Process',
    site: 'Site B',
    agent: 'Informed Consent Agent',
    severity: 'medium' as const,
    tags: ['Consent', 'Process'],
  },
];

const mockActivities = [
  {
    id: '1',
    agentName: 'Protocol Deviation Agent',
    action: 'Flagged 2 protocol deviations in Site A',
    timestamp: new Date('2024-04-01T10:30:00'),
    type: 'finding' as const,
    link: '/findings/1',
  },
  {
    id: '2',
    agentName: 'Informed Consent Agent',
    action: 'Completed review of 50 consent forms',
    timestamp: new Date('2024-04-01T09:15:00'),
    type: 'completion' as const,
    link: '/audit/2',
  },
];

export const Dashboard: React.FC = () => {
  const showOverview = false;
  const [showNavbar, setShowNavbar] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const navbarRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="flex flex-col h-full">
      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {/* Overview section */}
        {showOverview && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Overview</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Findings"
                value={mockStats.totalDeviations}
                icon={Activity}
                trend={{ value: 12, isPositive: false }}
                bgColor="bg-primary/10"
                iconColor="text-primary"
              />
              <StatCard
                title="In Progress Alerts"
                value={mockStats.openActions}
                icon={AlertOctagon}
                trend={{ value: 5, isPositive: true }}
                bgColor="bg-warning/10"
                iconColor="text-warning"
              />
              <StatCard
                title="Critical Findings"
                value={mockStats.criticalFindings}
                icon={AlertTriangle}
                trend={{ value: 2, isPositive: false }}
                bgColor="bg-destructive/10"
                iconColor="text-destructive"
              />
              <StatCard
                title="Audited Alerts"
                value={mockStats.completedActions}
                icon={CheckCircle}
                trend={{ value: 8, isPositive: true }}
                bgColor="bg-success/10"
                iconColor="text-success"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column */}
          <div className="space-y-6">
            <ReadinessScorecard items={mockReadinessItems} />
            <OngoingAudits audits={mockAudits} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <QuickActions actions={mockQuickActions} />
            <HighPriorityFindings findings={mockFindings} />
            <RecentActivity activities={mockActivities} />
          </div>
        </div>
      </div>
    </div>
  );
};
