import React from 'react';
import { Box, Server, FileText, FileSpreadsheet, File, Plus } from 'lucide-react';

interface FileStatType {
  type: string;
  count: number;
  icon: React.ReactNode;
}

interface TableStatType {
  name: string;
  count: number;
  records: number;
}

interface DataSourceType {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  summary: string;
  fileStats?: FileStatType[];
  tableStats?: TableStatType[];
  totalFiles?: number;
  totalTables?: number;
  contentSummary: string;
  lastSync: string;
}

// Mock data for data sources with detailed information
const dataSources: DataSourceType[] = [
  {
    id: 'box',
    name: 'Box',
    icon: <Box className="w-16 h-16 text-blue-600" />,
    color: 'blue',
    summary: 'Connected to Box cloud storage containing clinical trial guidelines documents.',
    fileStats: [
      { type: 'PDF', count: 7, icon: <FileText className="w-4 h-4 text-red-500" /> },
      { type: 'Excel', count: 1, icon: <FileSpreadsheet className="w-4 h-4 text-green-600" /> },
      { type: 'Word', count: 3, icon: <File className="w-4 h-4 text-blue-500" /> },
      { type: 'Other', count: 1, icon: <File className="w-4 h-4 text-gray-500" /> }
    ],
    totalFiles: 12,
    contentSummary: 'Documents primarily contain clinical trial protocols, patient data, audit findings, and compliance reports. Key trials include JNJ-28431754 (Phase 3), JNJ-63733657 (Phase 2), and JNJ-67896543 (Phase 1). Most recent documents focus on regulatory compliance and adverse event reporting.',
    lastSync: '2025-03-04T10:30:00'
  },
  {
    id: 'cosmos',
    name: 'Cosmos DB',
    icon: <Server className="w-16 h-16 text-purple-600" />,
    color: 'purple',
    summary: 'Connected to Azure Cosmos DB storing structured data for clinical trials.',
    tableStats: [
      { name: 'Protocol Deviation', count: 1, records: 1032837 },
      { name: 'Adverse Events', count: 1, records: 421049 },
      { name: 'Informed Consent', count: 1, records: 210314 },
      { name: 'Staff Training', count: 1, records: 392193 }
    ],
    totalTables: 4,
    contentSummary: 'Database contains structured information about clinical trials including protocol deviations, adverse events, informed consent, and staff training records. Most active tables are Protocol Deviation and Adverse Events with frequent updates.',
    lastSync: '2025-03-05T09:15:00'
  }
];

const DataSources: React.FC = () => {
  return (
    <div className="bg-gray-50 p-6">
      {/* Data Sources Grid - Changed to 1 column on small/medium screens, 2 on large */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Source Tiles */}
        {dataSources.map((source) => (
          <div 
            key={source.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-5">
              <div className={`bg-${source.color}-50 p-4 rounded-lg`}>
                {source.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">{source.name}</h3>
                <p className="text-gray-600">{source.summary}</p>
              </div>
            </div>
            
            {/* File/Table Statistics */}
            <div className="mb-5">
              {source.id === 'box' && source.fileStats && source.totalFiles && (
                <>
                  <h4 className="font-medium text-gray-700 mb-3">File Statistics</h4>
                  <div className={`bg-${source.color}-50 p-4 rounded-lg mb-4`}>
                    <div className="flex justify-between mb-3">
                      <span className="text-gray-600">Total Files:</span>
                      <span className="font-semibold">{source.totalFiles}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {source.fileStats.map((stat, index) => (
                        <div key={index} className="flex items-center bg-white p-2 rounded-md shadow-sm">
                          {stat.icon}
                          <span className="ml-2 text-gray-600">{stat.type}:</span>
                          <span className="ml-auto font-medium">{stat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {source.id === 'cosmos' && source.tableStats && source.totalTables && (
                <>
                  <h4 className="font-medium text-gray-700 mb-3">Database Statistics</h4>
                  <div className={`bg-${source.color}-50 p-4 rounded-lg mb-4`}>
                    <div className="flex justify-between mb-3">
                      <span className="text-gray-600">Total Tables:</span>
                      <span className="font-semibold">{source.totalTables}</span>
                    </div>
                    <div className="bg-white rounded-md shadow-sm overflow-hidden">
                      <div className="grid grid-cols-12 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                        <div className="col-span-7 py-2 px-3">Table</div>
                        <div className="col-span-5 py-2 px-3 text-right">Records</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {source.tableStats.map((table, index) => (
                          <div key={index} className="grid grid-cols-12 text-sm hover:bg-purple-50 transition-colors">
                            <div className="col-span-7 py-2 px-3 text-gray-700">{table.name}</div>
                            <div className="col-span-5 py-2 px-3 text-right font-medium text-gray-900">{table.records.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Content Summary - Temporarily hidden */}
            {/* <div className="mb-5">
              <h4 className="font-medium text-gray-700 mb-2">Content Summary</h4>
              <p className={`text-gray-600 text-sm bg-${source.color}-50 p-4 rounded-lg`}>
                {source.contentSummary}
              </p>
            </div> */}
            
            {/* Last Synced */}
            <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-4">
              <span>Last synced: {new Date(source.lastSync).toLocaleString()}</span>
              <span className={`bg-${source.color}-100 text-${source.color}-800 px-2 py-1 rounded-full text-xs`}>Connected</span>
            </div>
          </div>
        ))}
        
        {/* Add New Data Source Tile */}
        <div className="bg-white border border-dashed border-gray-300 rounded-lg shadow-md p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer h-96">
          <div className="bg-blue-50 rounded-full p-5 mb-4">
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
