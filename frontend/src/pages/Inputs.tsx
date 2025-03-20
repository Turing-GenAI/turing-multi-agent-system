import React, { useState, useRef } from 'react';
import { Database, Users, Activity, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import DataSources from '../components/inputs/DataSources';
import UserInputs from '../components/inputs/UserInputs';
import SystemArchitecture from '../components/inputs/SystemArchitecture';
import MultiAgentArchitecture from '../components/inputs/MultiAgentArchitecture';

// Define the tab types
type TabType = 'data_sources' | 'system_architecture' | 'multi_agent_architecture' | 'user_inputs';

export const Inputs: React.FC = () => {
  // State to track the selected tab
  const [selectedTab, setSelectedTab] = useState<TabType>('data_sources');
  // State to track if the sidebar is collapsed
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // State for navbar scroll hiding
  const [showNavbar, setShowNavbar] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const navbarRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getTabClasses = (tabName: TabType) => {
    const isActive = selectedTab === tabName;
    return `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-3'} py-3 w-full text-left rounded-md relative transition-all duration-300 ease-in-out ${
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
        <header 
          ref={navbarRef}
          className={`bg-white border-b border-gray-200 sticky top-0 z-10 transition-transform duration-300 ${
            !showNavbar ? 'transform -translate-y-full' : ''
          }`}
        >
          <div className="flex items-center justify-between py-4 px-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900">Data Inputs</h1>
              <p className="ml-4 text-sm text-gray-500">
                Configure and manage data sources, system architecture, and user inputs
              </p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div 
          className="flex-1 flex overflow-hidden"
          onScroll={(e) => {
            const target = e.currentTarget;
            const currentScrollPos = target.scrollTop;
            
            if (currentScrollPos > prevScrollPos) {
              // Scrolling down, hide navbar
              setShowNavbar(false);
            } else {
              // Scrolling up, show navbar
              setShowNavbar(true);
            }
            
            setPrevScrollPos(currentScrollPos);
          }}
        >
          {/* Left Panel - Tabbed Menu */}
          <div 
            className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col relative ${
              isSidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            {/* Toggle Button - Positioned at the top right of the sidebar */}
            <button 
              onClick={toggleSidebar}
              className="absolute top-2 right-2 p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors z-10"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            
            {/* Navigation Menu */}
            <nav className="flex-1 p-2 pt-10">
              <div className="space-y-2">
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
                  onClick={() => setSelectedTab('multi_agent_architecture')}
                  className={getTabClasses('multi_agent_architecture')}
                  title="Multi Agent Architecture"
                >
                  <div className={getIndicatorClasses('multi_agent_architecture')}></div>
                  <Layers className="w-5 h-5 min-w-5" />
                  {!isSidebarCollapsed && <span className="ml-3">Multi Agent Architecture</span>}
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
              </div>
            </nav>
          </div>

          {/* Right Panel - Content Area */}
          <div className="flex-1 overflow-auto">
            {selectedTab === 'data_sources' && <DataSources />}
            {selectedTab === 'system_architecture' && <SystemArchitecture />}
            {selectedTab === 'multi_agent_architecture' && <MultiAgentArchitecture />}
            {selectedTab === 'user_inputs' && <UserInputs />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inputs;
