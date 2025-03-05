import React from 'react';
import { Box, Server, FileText, FileSpreadsheet, File, Plus } from 'lucide-react';

// Mock data for data sources with detailed information
const dataSources = [
  {
    id: 'box',
    name: 'Box',
    icon: <Box className="w-16 h-16 text-blue-600" />,
    summary: 'Connected to Box cloud storage containing clinical trial documents and audit reports.',
    fileStats: [
      { type: 'PDF', count: 87, icon: <FileText className="w-4 h-4 text-red-500" /> },
      { type: 'Excel', count: 32, icon: <FileSpreadsheet className="w-4 h-4 text-green-600" /> },
      { type: 'Word', count: 18, icon: <File className="w-4 h-4 text-blue-500" /> },
      { type: 'Other', count: 5, icon: <File className="w-4 h-4 text-gray-500" /> }
    ],
    totalFiles: 142,
    contentSummary: 'Documents primarily contain clinical trial protocols, patient data, audit findings, and compliance reports. Key trials include JNJ-28431754 (Phase 3), JNJ-63733657 (Phase 2), and JNJ-67896543 (Phase 1). Most recent documents focus on regulatory compliance and adverse event reporting.',
    lastSync: '2025-03-04T10:30:00'
  },
  {
    id: 'cosmos',
    name: 'Cosmos DB',
    icon: <Server className="w-16 h-16 text-purple-600" />,
    summary: 'Connected to Azure Cosmos DB storing structured data for clinical trials.',
    tableStats: [
      { name: 'Trials', count: 15, records: 15 },
      { name: 'Participants', count: 1, records: 2547 },
      { name: 'Findings', count: 1, records: 342 },
      { name: 'Compliance', count: 1, records: 128 },
      { name: 'Audit Reports', count: 1, records: 43 }
    ],
    totalTables: 19,
    contentSummary: 'Database contains structured information about 15 clinical trials including participant demographics, compliance metrics, and audit findings. Schema includes relationships between trials, sites, and regulatory requirements. Most active tables are Participants and Findings with frequent updates.',
    lastSync: '2025-03-05T09:15:00'
  }
];

const DataSources: React.FC = () => {
  return (
    <div className="bg-white p-6">
      <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
      <p className="text-gray-600 mb-6">
        Connected data sources that provide information for analysis and processing.
      </p>
      
      {/* Data Sources Grid - Changed to 1 column on small/medium screens, 2 on large */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Source Tiles */}
        {dataSources.map((source) => (
          <div 
            key={source.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-5">
              <div className="bg-blue-50 p-3 rounded-lg">
                {source.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">{source.name}</h3>
                <p className="text-gray-600">{source.summary}</p>
              </div>
            </div>
            
            {/* File/Table Statistics */}
            <div className="mb-5">
              {source.id === 'box' && (
                <>
                  <h4 className="font-medium text-gray-700 mb-3">File Statistics</h4>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Total Files:</span>
                      <span className="font-semibold">{source.totalFiles}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {source.fileStats.map((stat, index) => (
                        <div key={index} className="flex items-center">
                          {stat.icon}
                          <span className="ml-2 text-gray-600">{stat.type}:</span>
                          <span className="ml-auto font-medium">{stat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {source.id === 'cosmos' && (
                <>
                  <h4 className="font-medium text-gray-700 mb-3">Database Statistics</h4>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Total Tables:</span>
                      <span className="font-semibold">{source.totalTables}</span>
                    </div>
                    <div className="overflow-hidden">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500">
                            <th className="py-1">Table</th>
                            <th className="py-1 text-right">Records</th>
                          </tr>
                        </thead>
                        <tbody>
                          {source.tableStats.map((table, index) => (
                            <tr key={index} className="text-sm">
                              <td className="py-1 text-gray-600">{table.name}</td>
                              <td className="py-1 text-right font-medium">{table.records}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Content Summary */}
            <div className="mb-5">
              <h4 className="font-medium text-gray-700 mb-2">Content Summary</h4>
              <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg">
                {source.contentSummary}
              </p>
            </div>
            
            {/* Last Synced */}
            <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-4">
              <span>Last synced: {new Date(source.lastSync).toLocaleString()}</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Connected</span>
            </div>
          </div>
        ))}
        
        {/* Add New Data Source Tile */}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer h-96">
          <div className="bg-blue-100 rounded-full p-5 mb-4">
            <Plus className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-3">Add Data Source</h3>
          <p className="text-gray-500 text-center max-w-xs">
            Connect a new data source to enhance your analysis capabilities. 
            Supported sources include cloud storage, databases, and APIs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataSources;
