import React from 'react';
import { Upload, Bot, Flag, ClipboardCheck, Info, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface OverviewStats {
  auditsInProgress: number;
  findingsFlagged: number;
  sitesAffected: number;
  capasOverdue: number;
}

interface DashboardOverviewProps {
  stats?: OverviewStats;
  userName?: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, userName }) => {
  const steps = [
    {
      icon: <Upload className="h-5 w-5" />,
      title: 'Upload Policies & Trial Data',
      description: 'SOPs, protocols, site documents, patient visit logs, etc.',
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: 'Run Audit Agents',
      description: 'GenAI agents simulate inspections and review documents',
    },
    {
      icon: <Flag className="h-5 w-5" />,
      title: 'Flag Issues & Generate Reports',
      description: 'Findings are grouped by severity and area',
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: 'Track CAPA',
      description: 'Assign corrective actions and ensure resolution before inspections',
    },
  ];

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <span>🧭 Audit Copilot Overview</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            "Your GenAI-powered assistant for FDA/GCP compliance and site inspection readiness."
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Learn More
        </Button>
      </div>

      {/* Description */}
      <div className="mb-8">
        <p className="text-foreground">
          This system uses a network of intelligent agents to automate the audit preparation process for pharmaceutical companies. 
          It helps QA, Regulatory, and Clinical teams identify compliance risks, generate audit findings, and track corrective 
          and preventive actions — all before an inspection happens.
        </p>
      </div>

      {/* How It Works */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">🧩 How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3 relative">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="text-primary">{step.icon}</div>
              </div>
              <div>
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-4 top-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {stats ? (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">📊 Current Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.auditsInProgress}</div>
              <div className="text-sm text-muted-foreground">Audits in Progress</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.findingsFlagged}</div>
              <div className="text-sm text-muted-foreground">Findings Flagged</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.sitesAffected}</div>
              <div className="text-sm text-muted-foreground">Sites Affected</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-warning">{stats.capasOverdue}</div>
              <div className="text-sm text-muted-foreground">CAPAs Overdue</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 p-6 rounded-lg text-center">
          <p className="text-muted-foreground">
            No audits yet — start by uploading documents or launching your first agent.
          </p>
          <Button className="mt-4">
            Start Your First Audit
          </Button>
        </div>
      )}
    </div>
  );
}; 