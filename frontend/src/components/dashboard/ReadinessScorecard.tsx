import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ReadinessItem {
  id: string;
  name: string;
  readiness: number;
  status: 'ready' | 'review' | 'critical';
}

interface ReadinessScorecardProps {
  items: ReadinessItem[];
}

export const ReadinessScorecard: React.FC<ReadinessScorecardProps> = ({ items }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'review':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-success/10 text-success';
      case 'review':
        return 'bg-warning/10 text-warning';
      case 'critical':
        return 'bg-destructive/10 text-destructive';
      default:
        return '';
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Audit Readiness Scorecard</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
            <div className="flex items-center space-x-3">
              {getStatusIcon(item.status)}
              <span className="font-medium text-foreground">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(item.status))}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </div>
              <div className="text-sm font-medium text-foreground">
                {item.readiness}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 