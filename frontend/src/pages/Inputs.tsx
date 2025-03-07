import React, { useState } from 'react';
import { Database, Users, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import DataSources from '../components/inputs/DataSources';
import UserInputs from '../components/inputs/UserInputs';
import SystemArchitecture from '../components/inputs/SystemArchitecture';

// Define the tab types
type TabType = 'data_sources' | 'user_inputs' | 'system_architecture';

export const Inputs: React.FC = () => {
  // State to track the selected tab
  const [selectedTab, setSelectedTab] = useState<TabType>('data_sources');
  // State to track if the sidebar is collapsed
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getTabClasses = (tabName: TabType) => {
    const isActive = selectedTab === tabName;
    return `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-3'} py-2 w-full text-left rounded-md relative transition-all duration-300 ease-in-out ${
      isActive 
        ? 'bg-blue-50 text-blue-700 font-medium' 
        : 'text-gray-700 hover:bg-gray-100'
    }`;
  };

  const getIndicatorClasses = (tabName: TabType) => {
    const isActive = selectedTab === tabName;
    return `absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-md transform transition-all duration-300 ease-in-out ${
      isActive ? 'scale-y-100' : 'scale-y-0'
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">Inputs</h1>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Tabbed Menu */}
          <div 
            className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                {!isSidebarCollapsed && (
                  <h2 className="text-lg font-medium text-gray-800">Configuration</h2>
                )}
                <button 
                  onClick={toggleSidebar}
                  className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedTab('data_sources')}
                  className={getTabClasses('data_sources')}
                  title="Data Sources"
                >
                  <div className={getIndicatorClasses('data_sources')}></div>
                  <Database className="w-5 h-5 min-w-5" />
                  {!isSidebarCollapsed && <span className="ml-3">Data Sources</span>}
                </button>
                <button
                  onClick={() => setSelectedTab('user_inputs')}
                  className={getTabClasses('user_inputs')}
                  title="User Inputs"
                >
                  <div className={getIndicatorClasses('user_inputs')}></div>
                  <Users className="w-5 h-5 min-w-5" />
                  {!isSidebarCollapsed && <span className="ml-3">User Inputs</span>}
                </button>
                <button
                  onClick={() => setSelectedTab('system_architecture')}
                  className={getTabClasses('system_architecture')}
                  title="System Architecture"
                >
                  <div className={getIndicatorClasses('system_architecture')}></div>
                  <Activity className="w-5 h-5 min-w-5" />
                  {!isSidebarCollapsed && <span className="ml-3">System Architecture</span>}
                </button>
              </nav>
            </div>
          </div>

          {/* Right Panel - Content Area */}
          <div className="flex-1 overflow-auto">
            {selectedTab === 'data_sources' && <DataSources />}
            {selectedTab === 'user_inputs' && <UserInputs />}
            {selectedTab === 'system_architecture' && <SystemArchitecture />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inputs;
