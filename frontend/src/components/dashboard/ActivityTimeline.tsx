import React from 'react';

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
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-blue-500" />
            <div className="absolute left-1.5 top-5 w-[1px] h-full bg-gray-200" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
              <div className="mt-2 flex items-center gap-4">
                <time className="text-xs text-gray-500">
                  {activity.timestamp.toLocaleDateString()} {activity.timestamp.toLocaleTimeString()}
                </time>
                {activity.status && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                    {activity.status}
                  </span>
                )}
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {activity.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
