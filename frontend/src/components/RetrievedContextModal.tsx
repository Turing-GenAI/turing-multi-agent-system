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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const previousDataRef = useRef<RetrievedContextResponse | null>(null);
  
  // Update the last update time and count when data changes
  useEffect(() => {
    if (data && data !== previousDataRef.current) {
      setLastUpdateTime(new Date());
      setUpdateCount(prev => prev + 1);
      previousDataRef.current = data;
    }
  }, [data]);
  
  // Reset expanded sections when data changes completely
  useEffect(() => {
    if (data && (!previousDataRef.current || Object.keys(data).sort().join(',') !== Object.keys(previousDataRef.current).sort().join(','))) {
      setExpandedSections({});
    }
  }, [data]);
  
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .html-table-container table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        table-layout: auto;
      }
      .html-table-container th,
      .html-table-container td {
        border: 1px solid #e2e8f0;
        padding: 0.75rem 0.5rem;
        text-align: left;
        vertical-align: top;
        word-break: normal;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .html-table-container th {
        background-color: var(--header-bg-color, #f8fafc);
        font-weight: 600;
        color: var(--header-text-color, #334155);
        position: sticky;
        top: 0;
        z-index: 1;
        white-space: nowrap;
      }
      .html-table-container tr:nth-child(even) {
        background-color: #f8fafc;
      }
      .html-table-container tr:hover {
        background-color: #f1f5f9;
      }
      .html-table-container tbody tr:hover td {
        background-color: rgba(236, 253, 245, 0.4);
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Only show modal if it's open
  if (!isOpen) {
    return null;
  }
  
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
  
  // Helper function to clean text content for display
  const cleanTextContent = (text: string): string => {
    if (!text) return '';
    
    // Only fix common encoding issues without changing formatting
    return text
      .replace(/�/g, 'ti') // Fix common encoding issues like "Inspec�on" -> "Inspection"
      .replace(/�/g, 'i'); // Another common encoding issue
  };
  
  // Helper function to clean sub-activity values
  const cleanSubactivityValue = (value: string | undefined) => {
    if (!value) return '';
    
    // Extract activity ID if present
    const activityIdMatch = value.match(/<activity_id#([^>]+)>/);
    const activityId = activityIdMatch ? activityIdMatch[1] : '';
    
    // Remove the activity ID tag, hash marks, and trim
    const cleanedText = value
      .replace(/<activity_id#[^>]+>/, '')
      .replace(/###/, '')
      .trim()
      .replace(/^\d+_/, '') // Remove numeric prefixes (e.g., "1_", "2_", etc.)
      .replace(/^(sub[-_\s]?activity|activity)[:;]?\s*/i, ''); // Remove activity/subactivity prefix
    
    // Return formatted string with activity ID if available
    return activityId ? `${activityId} - ${cleanedText}` : cleanedText;
  };
  
  // Helper function to determine if a metadata field should be shown
  const shouldShowMetadataField = (key: string, metadata: any): boolean => {
    const fieldsToHide = ['file_directory', 'page_name', 'page_number', 'languages', 'filetype', 'category', 'element_id', 'last_modified'];
    
    // Always hide site_area regardless of document type
    if (key === 'site_area') {
      return false;
    }
    
    const isSpreadsheetDoc = metadata.filename && (metadata.filename.endsWith('.xlsx') || metadata.filename.endsWith('.xls'));
    if (isSpreadsheetDoc && fieldsToHide.includes(key)) {
      return false;
    }
    return true;
  };
  
  // Helper function to map metadata keys to user-friendly display names
  const getMetadataDisplayName = (key: string): string => {
    const displayNameMap: Record<string, string> = {
      'source': 'Source',
      'chunk_index': 'Page Number',
      'file_name': 'File Name',
      'relative_path': 'Relative Path',
      'sql_query': 'SQL Query'
    };
    
    return displayNameMap[key] || key;
  };
  
  // Helper function to map source URLs for external links
  const mapSourceUrl = (source: string, metadata: any): string => {
    // For debugging
    console.log('Mapping source URL:', { source, metadata });
    
    // If source is already a URL, return it
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return source;
    }
    
    // Map specific sources to Box URLs
    if (source === 'rag_db.ae_sae.adverse_events') {
      return 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
    } else if (source === 'rag_db.pd.protocol_deviation') {
      return 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
    }
    
    // Check for specific file names in metadata
    if (metadata) {
      // Check both filename and file_name fields
      const fileName = metadata.filename || metadata.file_name;
      
      if (fileName) {
        console.log('Found filename in metadata:', fileName);
        
        // Handle specific filenames
        if (fileName === 'Inspection Readiness Guidance V4.0.pdf' || source === 'Inspection Readiness Guidance V4.0.pdf') {
          return 'https://app.box.com/s/tj41ww272kasc6cczqra6m8y7ljipeik';
        }
        
        // Handle Excel files related to adverse events
        if (fileName.includes('Adverse Events.xlsx') || fileName.toLowerCase().includes('adverse_events')) {
          return 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
        }
        
        // Handle Excel files related to protocol deviations
        if (fileName.includes('protocol_deviation.xlsx') || fileName.toLowerCase().includes('protocol_deviation')) {
          return 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
        }
      }
    }
    
    // Legacy mappings for backward compatibility
    if (source.includes('protocol_deviation.xlsx')) {
      return 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
    } else if (source.includes('AE_SAE/data/filtered_RaveReport_example') && source.includes('Adverse Events.xlsx')) {
      return 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
    } else if (source.includes('Inspection Readiness Guidance V4.0.pdf')) {
      return 'https://app.box.com/s/tj41ww272kasc6cczqra6m8y7ljipeik';
    }
    
    // For other file paths, just return as is
    return source;
  };
  
  // Helper function to handle source link clicks
  const handleSourceLinkClick = (source: string, metadata: any): boolean => {
    console.log('Handling source link click:', { source, metadata });
    
    // If source is already a URL, allow default behavior
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return true;
    }
    
    // Check for specific file names in metadata
    if (metadata) {
      const fileName = metadata.filename || metadata.file_name;
      
      // Handle specific file types
      if (fileName) {
        // Check if it's an Excel file or other supported file type
        const isExcelFile = fileName.toLowerCase().endsWith('.xlsx') || 
                           fileName.toLowerCase().endsWith('.xls') ||
                           fileName.toLowerCase().includes('adverse_events') ||
                           fileName.toLowerCase().includes('protocol_deviation');
                           
        const isPdfFile = fileName.toLowerCase().endsWith('.pdf');
        
        // For Excel files and PDFs, allow default behavior to open Box URL
        if (isExcelFile || isPdfFile) {
          return true;
        }
      }
    }
    
    // For other file paths, allow default behavior
    return true;
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
  const extractContentAndMetadata = (data: any): Array<{
    content: string;
    metadata: any;
    htmlTable: string | null;
    activity: string | null;
    subActivity: string | null;
    question: string | null;
    relevanceScore: number | undefined;
    summary: string | null;
  }> => {
    const results: Array<{
      content: string;
      metadata: any;
      htmlTable: string | null;
      activity: string | null;
      subActivity: string | null;
      question: string | null;
      relevanceScore: number | undefined;
      summary: string | null;
    }> = [];
    
    // Helper function to remove numeric prefix from path segments
    const removeNumPrefix = (path: string) => {
      return path.replace(/^\d+_/, '');
    };
    
    // Function to traverse nested data structure
    const traverse = (obj: any, path: string[] = []) => {
      // Handle PostgreSQL format data
      if (obj && typeof obj === 'object') {
        // Check if this is a leaf node with page_content and metadata
        if (obj.page_content !== undefined && obj.metadata !== undefined) {
          let activity = null;
          let subActivity = null;
          let question = null;
          let relevanceScore = undefined;
          let summary = null;
          let htmlTable = null;
          
          // Extract activity from path
          const activityPath = path.find(p => !p.includes('<activity_id#') && !p.match(/^\d+_[A-Za-z]/));
          if (activityPath) {
            activity = removeNumPrefix(activityPath);
          }
          
          // Extract sub-activity from path
          const subActivityPath = path.find(p => p.includes('<activity_id#'));
          if (subActivityPath) {
            subActivity = subActivityPath;
          }
          
          // Find the question after the sub-activity
          const subActivityIndex = path.findIndex(p => p.includes('<activity_id#'));
          if (subActivityIndex !== -1) {
            const questionPath = path.find(p => {
              const index = path.indexOf(p);
              return index > subActivityIndex && p.match(/^\d+_[A-Za-z]/);
            });
            
            if (questionPath) {
              question = removeNumPrefix(questionPath);
            }
          }
          
          // Extract relevance score and summary if available
          if (obj.metadata.relevance_score !== undefined) {
            relevanceScore = parseFloat(obj.metadata.relevance_score);
          }
          
          if (obj.metadata.summary) {
            summary = obj.metadata.summary;
          }
          
          // Extract HTML table if available
          if (obj.metadata.original_data && typeof obj.metadata.original_data === 'string' && 
              obj.metadata.original_data.includes('<table')) {
            htmlTable = obj.metadata.original_data;
          } else if (obj.metadata.text_as_html && typeof obj.metadata.text_as_html === 'string' && 
                    obj.metadata.text_as_html.includes('<table')) {
            htmlTable = obj.metadata.text_as_html;
          } else if (obj.page_content && typeof obj.page_content === 'string' && 
                    obj.page_content.includes('<table')) {
            // Sometimes the table might be in the page_content
            htmlTable = obj.page_content;
          }
          
          results.push({
            content: obj.page_content,
            metadata: obj.metadata,
            htmlTable,
            activity,
            subActivity,
            question,
            relevanceScore,
            summary
          });
        }
        
        // If this is an array, process each item
        if (Array.isArray(obj)) {
          obj.forEach(item => traverse(item, path));
          return;
        }
        
        // Otherwise, recursively process all properties
        Object.entries(obj).forEach(([key, value]) => {
          traverse(value, [...path, key]);
        });
      }
    };
    
    // Start processing from the top level
    traverse(data);
    
    return results;
  };

  // Format relevance score as percentage
  const formatRelevanceScore = (score?: number): string => {
    if (score === undefined) return 'N/A';
    return `${(score * 100).toFixed(1)}%`;
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
              
              if (displayKey === 'PD') {
                formattedDisplayKey = 'Domain 1';
              } else if (displayKey === 'AE_SAE') {
                formattedDisplayKey = 'Domain 2';
              }
              
              // Define color classes based on section type
              const headerBgClass = 'bg-gray-100';
              const textColorClass = 'text-gray-700';
              const iconColorClass = 'text-gray-700';
              const badgeBgClass = 'bg-gray-50';
              const badgeTextClass = 'text-gray-700';
              
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
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <AlertTriangle size={14} className="text-gray-700" />
                          </div>
                        )}
                        {displayKey === 'AE_SAE' && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <AlertCircle size={14} className="text-gray-700" />
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
                                
                                {/* Display relevance score if available */}
                                {item.relevanceScore !== undefined && (
                                  <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                      Relevance Score
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                      <span className={`px-2 py-0.5 rounded-full text-xs ${item.relevanceScore > 0.7 ? 'bg-green-100 text-green-800' : item.relevanceScore > 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {formatRelevanceScore(item.relevanceScore)}
                                      </span>
                                    </td>
                                  </tr>
                                )}
                                
                                {/* Display summary if available */}
                                {item.summary && (
                                  <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                      Summary
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                      {item.summary}
                                    </td>
                                  </tr>
                                )}
                                
                                {/* Display other metadata fields */}
                                {Object.entries(item.metadata)
                                  .filter(([metaKey]) => metaKey !== 'text_as_html' && metaKey !== 'relevance_score' && metaKey !== 'summary') // Exclude special fields
                                  .filter(([metaKey]) => shouldShowMetadataField(metaKey, item.metadata)) // Apply our custom filter
                                  .map(([metaKey, metaValue]) => (
                                  <tr key={metaKey} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                      {getMetadataDisplayName(metaKey)}
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                      {metaKey === 'source' || metaKey === 'filename' || metaKey === 'file_name' ? (
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
                              <div className="border rounded shadow-sm">
                                <div 
                                  className="p-2 text-sm html-table-container overflow-x-auto overflow-y-auto" 
                                  style={{
                                    '--header-bg-color': '#f7f7f7',
                                    '--header-text-color': '#333',
                                    maxHeight: '350px'
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
