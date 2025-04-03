import React from 'react';
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
import { ReadinessScorecard } from '../components/dashboard/ReadinessScorecard';
import { OngoingAudits } from '../components/dashboard/OngoingAudits';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { HighPriorityFindings } from '../components/dashboard/HighPriorityFindings';
import { QuickActions } from '../components/dashboard/QuickActions';
import { QuarterlyStats } from '../components/dashboard/QuarterlyStats';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';

// Mock data for overview stats
const mockOverviewStats = {
  auditsInProgress: 3,
  findingsFlagged: 7,
  sitesAffected: 2,
  capasOverdue: 2,
};

// Mock data for quarterly stats
const mockQuarterlyData = [
  {
    id: 'q2-2024',
    quarter: 'Q2 2024',
    ongoingTrials: 30542,
    trialsAudited: 30542,
    openAlerts: 14,
    completedAlerts: 120342,
  },
  {
    id: 'q3-2024',
    quarter: 'Q3 2024',
    ongoingTrials: 30123,
    trialsAudited: 30123,
    openAlerts: 162,
    completedAlerts: 100322,
  },
  {
    id: 'q4-2024',
    quarter: 'Q4 2024',
    ongoingTrials: 30891,
    trialsAudited: 30891,
    openAlerts: 125,
    completedAlerts: 80123,
  },
  {
    id: 'q1-2025',
    quarter: 'Q1 2025',
    ongoingTrials: 31015,
    trialsAudited: 31014,
    openAlerts: 167249,
    completedAlerts: 0,
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

export const DashboardNew: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Overview Section */}
      <DashboardOverview stats={mockOverviewStats} userName="Sarah" />

      {/* Historical Data */}
      <div className="mb-8">
        <QuarterlyStats data={mockQuarterlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  );
}; 