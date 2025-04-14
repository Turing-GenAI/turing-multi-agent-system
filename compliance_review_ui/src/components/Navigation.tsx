import React from 'react';
import { FiHome, FiClipboard, FiActivity, FiSettings, FiInfo } from 'react-icons/fi';

interface NavigationProps {
  className?: string;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  className = '',
  onTabChange = () => {},
  activeTab = 'home'
}) => {
  return (
    <nav className={`w-16 bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 ${className}`}>
      <div className="mb-8">
        <img src="/images/Icon.png" alt="Navigation Icon" className="w-8 h-8" />
      </div>
      
      {/* Navigation Icons */}
      <div className="flex flex-col gap-6">
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${activeTab === 'home' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          onClick={() => onTabChange('home')}
          title="Home"
        >
          <FiHome className="w-5 h-5" />
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${activeTab === 'compliance' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          onClick={() => onTabChange('compliance')}
          title="Compliance Review"
        >
          <FiClipboard className="w-5 h-5" />
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          onClick={() => onTabChange('analytics')}
          title="Analytics"
        >
          <FiActivity className="w-5 h-5" />
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${activeTab === 'information' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          onClick={() => onTabChange('information')}
          title="Information Collection"
        >
          <FiInfo className="w-5 h-5" />
        </button>
        
        <button 
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          onClick={() => onTabChange('settings')}
          title="Settings"
        >
          <FiSettings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}; 