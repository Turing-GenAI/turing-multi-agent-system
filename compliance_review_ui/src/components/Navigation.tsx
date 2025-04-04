import React from 'react';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  return (
    <nav className={`w-16 bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 ${className}`}>
      <div className="mb-6">
        <img src="/images/Icon.png" alt="Navigation Icon" className="w-8 h-8" />
      </div>
      {/* Placeholder for additional navigation icons */}
      <div className="flex flex-col gap-4">
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
      </div>
    </nav>
  );
}; 