import React from 'react';
import { AlertTriangle, FileWarning, FileX } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'finding' | 'action' | 'deviation';
  status?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const getAlertStyle = (activity: Activity) => {
    // Check if title contains specific keywords to determine alert type
    const title = activity.title.toLowerCase();
    
    if (title.includes('protocol deviation')) {
      return {
        dotColor: 'bg-amber-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />
      };
    } else if (title.includes('adverse event')) {
      return {
        dotColor: 'bg-red-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        icon: <FileWarning className="h-4 w-4 text-red-500" />
      };
    } else if (title.includes('informed consent')) {
      return {
        dotColor: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        icon: <FileX className="h-4 w-4 text-orange-500" />
      };
    } else {
      // Default blue for other alerts
      return {
        dotColor: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        icon: null
      };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
      <div className="space-y-6">
        {activities.map((activity) => {
          const alertStyle = getAlertStyle(activity);
          
          return (
            <div key={activity.id} className="relative pl-8">
              <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ${alertStyle.dotColor}`} />
              <div className="absolute left-1.5 top-5 w-[1px] h-full bg-gray-200" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  {alertStyle.icon}
                  {activity.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <time className="text-xs text-gray-500">
                    {activity.timestamp.toLocaleDateString()} {activity.timestamp.toLocaleTimeString()}
                  </time>
                  {activity.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${alertStyle.bgColor} ${alertStyle.textColor}`}>
                      {activity.status}
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {activity.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
