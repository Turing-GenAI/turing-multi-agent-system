import React from 'react';
import { Bot, AlertTriangle, FileCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface Activity {
  id: string;
  agentName: string;
  action: string;
  timestamp: Date;
  type: 'finding' | 'review' | 'completion';
  link?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'finding':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'review':
        return <FileCheck className="h-5 w-5 text-primary" />;
      case 'completion':
        return <Bot className="h-5 w-5 text-success" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Agent Activity</h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-md bg-muted/30">
            <div className="mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {activity.agentName}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {activity.action}
              </p>
              {activity.link && (
                <Link 
                  to={activity.link}
                  className="text-xs text-primary hover:text-primary/80 mt-2 inline-flex items-center"
                >
                  View details
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 