import React, { useState, useEffect, useRef } from 'react';
import { RetrievedContextResponse } from '../api';
import { ChevronDown, ChevronRight, ExternalLink, Copy, Check, X, RefreshCw, FileText, AlertTriangle, AlertCircle, Database } from 'lucide-react';

interface RetrievedContextModalProps {
  data: RetrievedContextResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}

export const RetrievedContextModal: React.FC<RetrievedContextModalProps> = ({ 
  data, 
  isOpen, 
  onClose,
  onRefresh
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const previousDataRef = useRef<RetrievedContextResponse | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to clean up subactivity values by extracting activity ID and removing hash values
  const cleanSubactivityValue = (value: string): string => {
    if (!value) return '';
    
    // Extract activity ID if present
    const activityIdMatch = value.match(/<activity_id#([^>]+)>/);
    const activityId = activityIdMatch ? activityIdMatch[1] : '';
    
    // Remove the activity ID tag, hash marks, and trim
    const cleanedText = value
      .replace(/<activity_id#[^>]+>/, '')
      .replace(/###/, '')
      .trim();
    
    // Return formatted string with activity ID if available
    return activityId ? `${activityId} - ${cleanedText}` : cleanedText;
  };

  // Temporary function to map local URLs to Box URLs
  // This will be removed once working URLs come from the backend
  const mapSourceUrl = (url: string, metadata?: any): string => {
    // For debugging
    console.log('Source URL mapping:', { url, metadata });
    
    let mappedUrl = url;
    
    // Map for known URLs
    if (url.includes('protocol_deviation.xlsx')) {
      mappedUrl = 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
    } else if (url.includes('AE_SAE/data/filtered_RaveReport_example') && url.includes('Adverse Events.xlsx')) {
      mappedUrl = 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
    } else if (url.includes('Inspection Readiness Guidance V4.0.pdf')) {
      // For PDF documents in Box, use the base URL
      mappedUrl = 'https://app.box.com/s/tj41ww272kasc6cczqra6m8y7ljipeik';
    }
    
    return mappedUrl;
  };

  // Function to clean up text content from the backend
  const cleanTextContent = (text: string): string => {
    if (!text) return '';
    
    // Only fix common encoding issues without changing formatting
    return text
      .replace(/�/g, 'ti') // Fix common encoding issues like "Inspec�on" -> "Inspection"
      .replace(/�/g, 'i'); // Another common encoding issue
  };

  // Function to handle source link click
  const handleSourceLinkClick = (url: string, metadata?: any) => {
    const mappedUrl = mapSourceUrl(url, metadata);
    console.log('Handling source link click:', { url, mappedUrl, metadata });
    
    // Open the URL in a new window
    window.open(mappedUrl, '_blank');
    return false; // Prevent default link behavior
  };

  // Function to filter metadata fields for spreadsheet-type documents
  const shouldShowMetadataField = (key: string, metadata: any): boolean => {
    // List of fields to hide for spreadsheet-type documents
    const fieldsToHide = [
      'file_directory',
      'page_name',
      'page_number',
      'languages',
      'filetype',
      'category',
      'element_id',
      'last_modified'
    ];
    
    // Check if this is a spreadsheet-type document
    const isSpreadsheetDoc = metadata.filename && 
      (metadata.filename.endsWith('.xlsx') || 
       metadata.filename.endsWith('.xls') || 
       metadata.filename.endsWith('.csv') ||
       (metadata.filetype && 
        (metadata.filetype.includes('excel') || 
         metadata.filetype.includes('spreadsheet') || 
         metadata.filetype.includes('csv'))));
    
    // If it's a spreadsheet document and the field is in the hide list, don't show it
    if (isSpreadsheetDoc && fieldsToHide.includes(key)) {
      return false;
    }
    
    return true;
  };

  // Custom CSS for styling HTML tables
  const tableStyles = `
    .html-table-container table {
      border-collapse: collapse;
      width: 100%;
      font-size: 0.875rem;
      border-radius: 0.375rem;
      overflow: hidden;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    
    .html-table-container table td,
    .html-table-container table th {
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
    }
    
    .html-table-container table tr:first-child {
      font-weight: bold;
      background-color: var(--header-bg-color);
      color: var(--header-text-color);
    }
    
    .html-table-container table tr:not(:first-child):hover {
      background-color: #f9fafb;
    }
  `;

  useEffect(() => {
    // Add styles for HTML tables
    const styleTag = document.createElement('style');
    styleTag.innerHTML = tableStyles;
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

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Error refreshing context data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to extract content, metadata, and HTML tables from nested structure
  const extractContentAndMetadata = (obj: any): Array<{ content: string; metadata: any; htmlTable: string | null; activity?: string; subActivity?: string; question?: string }> => {
    const results: Array<{ content: string; metadata: any; htmlTable: string | null; activity?: string; subActivity?: string; question?: string }> = [];
    
    // Helper function to remove numerical prefixes like "0_", "1_", etc.
    const removeNumPrefix = (str: string) => {
      return str.replace(/^\d+_/, '');
    };
    
    // Process the documents recursively, keeping track of the path
    const processDocuments = (obj: any, path: string[] = []) => {
      if (!obj || typeof obj !== 'object') return;
      
      // If this is a document with page_content and metadata
      if (obj.page_content && obj.metadata) {
        // Extract activity, sub-activity, and question from the path
        let activity = '';
        let subActivity = '';
        let question = '';
        
        // Extract the activity from the path
        const activityPath = path.find(p => p.match(/^\d+_PD$/) || p.match(/^\d+_AE_SAE$/));
        if (activityPath) {
          activity = activityPath.match(/^\d+_PD$/) ? "PD" : "AE_SAE";
        }
        
        // Extract the sub-activity (with activity_id) from the path
        const subActivityPath = path.find(p => p.includes('<activity_id#'));
        if (subActivityPath) {
          // Keep the full sub-activity including the activity_id
          subActivity = removeNumPrefix(subActivityPath);
        }
        
        // Extract the question from the path
        const questionPath = path.find(p => {
          // Find the question after the sub-activity
          const subActivityIndex = path.findIndex(p => p.includes('<activity_id#'));
          if (subActivityIndex === -1) return false;
          
          const index = path.indexOf(p);
          return index > subActivityIndex && p.match(/^\d+_[A-Za-z]/);
        });
        
        if (questionPath) {
          question = removeNumPrefix(questionPath);
        }
        
        results.push({
          content: obj.page_content,
          metadata: obj.metadata,
          htmlTable: obj.metadata.text_as_html || null,
          activity,
          subActivity,
          question
        });
        return;
      }
      
      // If this is an array, process each item
      if (Array.isArray(obj)) {
        obj.forEach(item => processDocuments(item, path));
        return;
      }
      
      // Otherwise, recursively process all properties
      Object.entries(obj).forEach(([key, value]) => {
        processDocuments(value, [...path, key]);
      });
    };
    
    // Start processing from the top level
    processDocuments(obj);
    
    return results;
  };

  if (!data) {
    return (
      <div 
        className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-slideIn overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
        >
          {/* Header with white styling and blue text */}
          <div className="bg-white border-b border-gray-200 p-5 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Database size={16} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-blue-600">Retrieved Context</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-blue-500 hover:text-blue-700 focus:outline-none bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors shadow-sm"
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
    <div 
      className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-slideIn overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {/* Header with white styling and blue text */}
        <div className="bg-white border-b border-gray-200 p-5 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Database size={16} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-blue-600">Retrieved Context</h2>
            {lastUpdateTime && (
              <div className="ml-4 text-sm text-gray-600 flex items-center bg-gray-50 px-3 py-1 rounded-full shadow-sm">
                <span className="mr-1">
                  <RefreshCw size={14} className="text-blue-500" />
                </span>
                Last updated: {lastUpdateTime.toLocaleTimeString()} 
                <span className="ml-2 px-2 py-0.5 bg-gray-50 rounded-full text-xs text-gray-600">
                  {updateCount} update{updateCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-blue-500 hover:text-blue-700 focus:outline-none bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content area with subtle pattern */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Document Context</h3>
            {Object.entries(data).map(([key, value]) => {
              const displayKey = key.replace(/^[0-9]+_/, '');
              const isExpanded = expandedSections[key] ?? false;
              const contentItems = extractContentAndMetadata(value);
              
              // Format the display key with full form instead of abbreviations
              let formattedDisplayKey = displayKey;
              let sectionColor = 'gray'; // Default color
              
              if (displayKey === 'PD') {
                formattedDisplayKey = 'Protocol Deviations';
                sectionColor = 'yellow';
              } else if (displayKey === 'AE_SAE') {
                formattedDisplayKey = 'Adverse Events / Serious Adverse Events';
                sectionColor = 'orange';
              }
              
              // Define color classes based on section type
              const headerBgClass = 'bg-gray-100';
              const textColorClass = sectionColor === 'yellow' ? 'text-yellow-600' : (sectionColor === 'orange' ? 'text-orange-600' : 'text-gray-600');
              const iconColorClass = sectionColor === 'yellow' ? 'text-yellow-500' : (sectionColor === 'orange' ? 'text-orange-500' : 'text-gray-500');
              const badgeBgClass = 'bg-gray-50';
              const badgeTextClass = sectionColor === 'yellow' ? 'text-yellow-600' : (sectionColor === 'orange' ? 'text-orange-600' : 'text-gray-600');
              
              return (
                <div key={key} className="border rounded-lg overflow-visible shadow-sm mb-4 bg-white">
                  <div 
                    className={`${headerBgClass} p-3 cursor-pointer flex items-center justify-between transition-colors`}
                    onClick={() => toggleSection(key)}
                  >
                    <div className="flex items-center">
                      {isExpanded ? 
                        <ChevronDown className={`w-4 h-4 ${iconColorClass}`} /> : 
                        <ChevronRight className={`w-4 h-4 ${iconColorClass}`} />
                      }
                      <div className="flex items-center">
                        {displayKey === 'PD' && (
                          <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                            <AlertTriangle size={14} className="text-yellow-500" />
                          </div>
                        )}
                        {displayKey === 'AE_SAE' && (
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                            <AlertCircle size={14} className="text-orange-500" />
                          </div>
                        )}
                        <h4 className={`font-medium ${textColorClass}`}>{formattedDisplayKey}</h4>
                        <span className={`text-xs ${badgeTextClass} bg-white px-2 py-0.5 rounded-full ml-2`}>
                          {contentItems.length} {contentItems.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="divide-y divide-gray-100 animate-slideDown">
                      {contentItems.map((item, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          {/* Item Number */}
                          <div className="mb-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-medium text-sm mr-2 shadow-sm`}>
                              {index + 1}
                            </span>
                            <span className="text-sm text-gray-500">Item {index + 1} of {contentItems.length}</span>
                          </div>
                          
                          {/* Metadata Table */}
                          <div className="mb-3 overflow-x-auto">
                            <table className="min-w-full text-xs border-collapse shadow-sm rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Property</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Display subActivity as Activity */}
                                {item.subActivity && (
                                  <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                      Activity
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                      {cleanSubactivityValue(item.subActivity)}
                                    </td>
                                  </tr>
                                )}
                                
                                {/* Display question as Sub-activity */}
                                {item.question && (
                                  <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                      Sub-activity
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                      {item.question}
                                    </td>
                                  </tr>
                                )}
                                
                                {/* Display other metadata fields */}
                                {Object.entries(item.metadata)
                                  .filter(([metaKey]) => metaKey !== 'text_as_html') // Exclude text_as_html from metadata table
                                  .filter(([metaKey]) => shouldShowMetadataField(metaKey, item.metadata)) // Apply our custom filter
                                  .map(([metaKey, metaValue]) => (
                                  <tr key={metaKey} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                      {metaKey}
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                      {metaKey === 'source' ? (
                                        <a 
                                          href={mapSourceUrl(metaValue as string, item.metadata)} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center"
                                          onClick={(e) => {
                                            if (!handleSourceLinkClick(metaValue as string, item.metadata)) {
                                              e.preventDefault();
                                            }
                                          }}
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
                                  style={{
                                    '--header-bg-color': '#f7f7f7',
                                    '--header-text-color': '#333'
                                  } as React.CSSProperties}
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
                                  {cleanTextContent(item.content).split('\n').map((paragraph, i) => (
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
        
        {/* Footer with white background */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {data && `${Object.keys(data).length} document section${Object.keys(data).length !== 1 ? 's' : ''} available`}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-500 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Fetching...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
