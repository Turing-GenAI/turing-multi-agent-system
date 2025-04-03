import React from 'react';
import { Clock, FileCheck, AlertCircle, Activity, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuarterData {
  id: string;
  quarter: string;
  ongoingTrials: number;
  trialsAudited: number;
  openAlerts: number;
  completedAlerts: number;
}

interface QuarterlyStatsProps {
  data: QuarterData[];
}

export const QuarterlyStats: React.FC<QuarterlyStatsProps> = ({ data }) => {
  const getPercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIndicator = (current: number, previous: number) => {
    const change = getPercentageChange(current, previous);
    if (change > 0) {
      return <span className="text-success text-xs">↑ {Math.abs(change).toFixed(1)}%</span>;
    } else if (change < 0) {
      return <span className="text-destructive text-xs">↓ {Math.abs(change).toFixed(1)}%</span>;
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Historical Data</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Last 4 Quarters</span>
          <Activity className="h-4 w-4 text-primary" />
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative mb-12">
        {/* Timeline container */}
        <div className="relative h-16">
          {/* Timeline line */}
          <div className="absolute left-[5%] right-[5%] h-0.5 top-[6px] bg-primary/10">
            <div className="absolute left-0 right-0 h-full bg-primary" />
          </div>

          {/* Timeline points */}
          <div className="absolute left-0 right-0 top-0 grid grid-cols-4">
            {data.map((quarter, index) => (
              <div key={quarter.id} className="flex flex-col items-center">
                <div className={cn(
                  "w-3 h-3 rounded-full mb-2 relative z-10",
                  index === data.length - 1 ? "bg-primary animate-pulse" : "bg-primary"
                )} />
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  index === data.length - 1 ? "text-primary" : "text-foreground"
                )}>
                  {quarter.quarter}
                  {index === data.length - 1 && " (Till Date)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-6 mt-8">
          {/* Ongoing Trials */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Ongoing Trials</span>
              </div>
              {data.length > 1 && getTrendIndicator(
                data[data.length - 1].ongoingTrials,
                data[data.length - 2].ongoingTrials
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {data.map((quarter, index) => (
                <div key={`${quarter.id}-ongoing`} className="text-center">
                  <span className={cn(
                    "text-lg font-semibold",
                    index === data.length - 1 ? "text-primary" : "text-foreground"
                  )}>
                    {quarter.ongoingTrials.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trials Audited */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Trials Audited</span>
              </div>
              {data.length > 1 && getTrendIndicator(
                data[data.length - 1].trialsAudited,
                data[data.length - 2].trialsAudited
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {data.map((quarter, index) => (
                <div key={`${quarter.id}-audited`} className="text-center">
                  <span className={cn(
                    "text-lg font-semibold",
                    index === data.length - 1 ? "text-success" : "text-foreground"
                  )}>
                    {quarter.trialsAudited.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Open Alerts */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span>Open Alerts</span>
              </div>
              {data.length > 1 && getTrendIndicator(
                data[data.length - 1].openAlerts,
                data[data.length - 2].openAlerts
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {data.map((quarter, index) => (
                <div key={`${quarter.id}-alerts`} className="text-center">
                  <span className={cn(
                    "text-lg font-semibold",
                    index === data.length - 1 ? "text-warning" : "text-foreground"
                  )}>
                    {quarter.openAlerts.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Alerts */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <FileCheck className="h-4 w-4 text-success" />
                <span>Completed Alerts</span>
              </div>
              {data.length > 1 && getTrendIndicator(
                data[data.length - 1].completedAlerts,
                data[data.length - 2].completedAlerts
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {data.map((quarter, index) => (
                <div key={`${quarter.id}-completed`} className="text-center">
                  <span className={cn(
                    "text-lg font-semibold",
                    index === data.length - 1 ? "text-success" : "text-foreground"
                  )}>
                    {quarter.completedAlerts.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 