import React, { useState } from 'react';
import { Database, Users, Activity } from 'lucide-react';
import DataSources from '../components/inputs/DataSources';
import UserInputs from '../components/inputs/UserInputs';
import SystemArchitecture from '../components/inputs/SystemArchitecture';

// Define the tab types
type TabType = 'data_sources' | 'user_inputs' | 'system_architecture';

export const Inputs: React.FC = () => {
  // State to track the selected tab
  const [selectedTab, setSelectedTab] = useState<TabType>('data_sources');

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
          <div className="w-64 bg-white border-r border-gray-200">
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Input Options</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedTab('data_sources')}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    selectedTab === 'data_sources' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Database className="w-5 h-5 mr-3" />
                  <span>Data Sources</span>
                </button>
                <button
                  onClick={() => setSelectedTab('user_inputs')}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    selectedTab === 'user_inputs' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5 mr-3" />
                  <span>User Inputs</span>
                </button>
                <button
                  onClick={() => setSelectedTab('system_architecture')}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    selectedTab === 'system_architecture' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Activity className="w-5 h-5 mr-3" />
                  <span>System Architecture</span>
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
