import React, { useState, useEffect, useRef } from 'react';
import { RetrievedContextResponse } from '../api';
import { ChevronDown, ChevronRight, ExternalLink, Copy, Check, X, RefreshCw } from 'lucide-react';

interface RetrievedContextModalProps {
  data: RetrievedContextResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RetrievedContextModal: React.FC<RetrievedContextModalProps> = ({ 
  data, 
  isOpen, 
  onClose 
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const previousDataRef = useRef<RetrievedContextResponse | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    // Add styles for HTML tables
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .html-table-container table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1rem;
      }
      .html-table-container th,
      .html-table-container td {
        border: 1px solid #e2e8f0;
        padding: 0.5rem;
        text-align: left;
      }
      .html-table-container th {
        background-color: #f8fafc;
        font-weight: 600;
      }
      .html-table-container tr:nth-child(even) {
        background-color: #f8fafc;
      }
    `;
    document.head.appendChild(styleTag);
    
    // Add keyboard event listener for ESC key
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.head.removeChild(styleTag);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Check for data updates and set last update time
  useEffect(() => {
    if (data && (!previousDataRef.current || JSON.stringify(data) !== JSON.stringify(previousDataRef.current))) {
      setLastUpdateTime(new Date());
      setUpdateCount(prevCount => prevCount + 1);
      previousDataRef.current = data;
    }
  }, [data]);

  // Reset expanded sections and update count when modal opens
  useEffect(() => {
    if (isOpen) {
      // Keep all sections closed by default
      setExpandedSections({});
      
      // Reset update count if this is a new session
      if (!previousDataRef.current) {
        setUpdateCount(0);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  // Helper function to extract content, metadata, and HTML tables from nested structure
  const extractContentAndMetadata = (obj: any): Array<{ content: string; metadata: any; htmlTable: string | null }> => {
    const results: Array<{ content: string; metadata: any; htmlTable: string | null }> = [];
    
    const traverse = (current: any) => {
      if (!current || typeof current !== 'object') return;
      
      if (current.page_content && current.metadata) {
        results.push({
          content: current.page_content,
          metadata: current.metadata,
          htmlTable: current.metadata.text_as_html || null
        });
        return;
      }
      
      Object.values(current).forEach(value => {
        traverse(value);
      });
    };
    
    traverse(obj);
    return results;
  };

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Retrieved Context</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>
          <div className="text-gray-500 italic p-4 flex-1">
            No retrieved context data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">Retrieved Context</h2>
            {lastUpdateTime && (
              <div className="ml-4 text-sm text-gray-500 flex items-center">
                <span className="mr-1">
                  <RefreshCw size={14} />
                </span>
                Last updated: {lastUpdateTime.toLocaleTimeString()} 
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {updateCount} update{updateCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-4 pb-6">
            {Object.entries(data).map(([key, value]) => {
              const displayKey = key.replace(/^[0-9]+_/, '');
              const isExpanded = expandedSections[key] ?? false;
              const contentItems = extractContentAndMetadata(value);
              
              // Format the display key with full form instead of abbreviations
              let formattedDisplayKey = displayKey;
              let sectionColor = 'blue'; // Default color
              
              if (displayKey === 'PD') {
                formattedDisplayKey = 'Protocol Deviations';
                sectionColor = 'blue';
              } else if (displayKey === 'AE_SAE') {
                formattedDisplayKey = 'Adverse Events / Serious Adverse Events';
                sectionColor = 'orange';
              }
              
              // Define color classes based on section type
              const headerBgClass = sectionColor === 'blue' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-orange-50 hover:bg-orange-100';
              const textColorClass = sectionColor === 'blue' ? 'text-blue-700' : 'text-orange-700';
              const iconColorClass = sectionColor === 'blue' ? 'text-blue-600' : 'text-orange-600';
              const badgeBgClass = sectionColor === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
              
              return (
                <div key={key} className="border rounded-lg overflow-visible shadow-sm mb-4">
                  <div 
                    className={`flex items-center justify-between p-3 ${headerBgClass} cursor-pointer transition-colors`}
                    onClick={() => toggleSection(key)}
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? 
                        <ChevronDown className={`w-4 h-4 ${iconColorClass}`} /> : 
                        <ChevronRight className={`w-4 h-4 ${iconColorClass}`} />
                      }
                      <h4 className={`font-medium ${textColorClass}`}>{formattedDisplayKey}</h4>
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                        {contentItems.length} {contentItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {contentItems.map((item, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          {/* Item Number */}
                          <div className="mb-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${badgeBgClass} font-medium text-sm mr-2`}>
                              {index + 1}
                            </span>
                            <span className="text-sm text-gray-500">Item {index + 1} of {contentItems.length}</span>
                          </div>
                          
                          {/* Metadata Table */}
                          <div className="mb-3 overflow-x-auto">
                            <table className="min-w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">Property</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(item.metadata)
                                  .filter(([metaKey]) => metaKey !== 'text_as_html') // Exclude text_as_html from metadata table
                                  .map(([metaKey, metaValue]) => (
                                  <tr key={metaKey} className="border-t border-gray-200">
                                    <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                      {metaKey}
                                    </td>
                                    <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                      {metaKey === 'source' ? (
                                        <a 
                                          href={metaValue as string} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center"
                                        >
                                          {String(metaValue).substring(0, 50)}
                                          {String(metaValue).length > 50 ? '...' : ''}
                                          <ExternalLink className="w-3 h-3 ml-1 inline" />
                                        </a>
                                      ) : (
                                        String(metaValue)
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* HTML Table Rendering */}
                          {item.htmlTable && (
                            <div className="mb-4">
                              <h5 className="font-medium text-gray-700 mb-2">Table Data:</h5>
                              <div className="overflow-x-auto border rounded max-h-96">
                                <div 
                                  className="p-2 text-sm html-table-container" 
                                  dangerouslySetInnerHTML={{ __html: item.htmlTable }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Content Section - Only show for non-Excel/table files */}
                          {!item.htmlTable && (
                            <div className="relative">
                              <div className="absolute top-2 right-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent click from affecting parent
                                    copyToClipboard(item.content);
                                  }}
                                  className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                                  title="Copy to clipboard"
                                >
                                  {copiedText === item.content ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                              </div>
                              <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                <div className="font-medium text-gray-700 mb-2">Raw Content:</div>
                                <div className="whitespace-pre-line text-gray-800">
                                  {item.content.split('\n').map((paragraph, i) => (
                                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
