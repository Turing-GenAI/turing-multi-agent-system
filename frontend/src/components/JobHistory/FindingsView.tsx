import React from 'react';
import { AlertCircle, FileWarning, AlertTriangle } from 'lucide-react';

interface FindingsViewProps {
  findings: any;
  loading: boolean;
  title: string;
  icon: 'warning' | 'alert';
  color: 'yellow' | 'orange';
}

const FindingsView: React.FC<FindingsViewProps> = ({ 
  findings, 
  loading, 
  title,
  icon,
  color
}) => {
  // Get the appropriate findings data based on the title
  const findingData = findings ? 
    (title.toLowerCase().includes('protocol') ? findings.pd : findings.ae) : 
    [];

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className={`text-lg font-semibold mb-4 text-${color}-700 flex items-center`}>
        {icon === 'warning' ? (
          <FileWarning className="w-5 h-5 mr-2" />
        ) : (
          <AlertCircle className="w-5 h-5 mr-2" />
        )}
        {title}
      </h3>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-${color}-500`}></div>
        </div>
      ) : !findingData || findingData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No {title.toLowerCase()} for this job</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
          <div className={`bg-${color}-100 p-3 cursor-pointer flex items-center justify-between transition-colors`}>
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full bg-${color}-100 flex items-center justify-center mr-2`}>
                <AlertTriangle size={14} className={`text-${color}-500`} />
              </div>
              <h4 className={`font-medium text-${color}-600`}>{title}</h4>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                {findingData.length} {findingData.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {findingData.map((finding: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{finding.id || `Finding #${index + 1}`}</div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{finding.content}</p>
                {finding.table && finding.table.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                      <thead className={`bg-${color}-50`}>
                        <tr>
                          {Object.keys(finding.table[0]).map((key) => (
                            <th 
                              key={key}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border border-gray-200"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {finding.table.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex} className={`hover:bg-${color}-50/30`}>
                            {Object.values(row).map((cell: any, cellIndex: number) => (
                              <td 
                                key={cellIndex}
                                className="px-3 py-2 text-sm text-gray-900 border border-gray-200"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindingsView;
