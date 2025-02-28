import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorScheme?: 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  colorScheme = 'blue'
}) => {
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'amber':
        return { bg: 'bg-amber-50', text: 'text-amber-500' };
      case 'red':
        return { bg: 'bg-red-50', text: 'text-red-500' };
      case 'green':
        return { bg: 'bg-green-50', text: 'text-green-500' };
      case 'purple':
        return { bg: 'bg-purple-50', text: 'text-purple-500' };
      case 'orange':
        return { bg: 'bg-orange-50', text: 'text-orange-500' };
      case 'blue':
      default:
        return { bg: 'bg-blue-50', text: 'text-blue-500' };
    }
  };

  const { bg, text } = getColorClasses();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 ${bg} rounded-full`}>
          <Icon className={`w-6 h-6 ${text}`} />
        </div>
      </div>
    </div>
  );
};
