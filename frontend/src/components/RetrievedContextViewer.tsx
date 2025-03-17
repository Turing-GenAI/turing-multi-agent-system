import React, { useState, useEffect } from 'react';
import { RetrievedContextResponse } from '../api';
import { ChevronDown, ChevronRight, ExternalLink, Copy, Check } from 'lucide-react';

interface RetrievedContextViewerProps {
  data: RetrievedContextResponse | null;
}

export const RetrievedContextViewer: React.FC<RetrievedContextViewerProps> = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

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

  if (!data) {
    return (
      <div className="text-gray-500 italic p-4">
        No retrieved context data available
      </div>
    );
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
      .replace(/^\d+_/, '') // Remove numeric prefixes (e.g., "1_")
      .replace(/^(sub[-_\s]?activity|activity)[:;]?\s*/i, ''); // Remove activity/subactivity prefix
    
    // Return formatted string with activity ID if available
    return activityId ? `${activityId} - ${cleanedText}` : cleanedText;
  };

  // Helper function to determine if a metadata field should be shown
  const shouldShowMetadataField = (key: string, metadata: any): boolean => {
    const fieldsToHide = ['file_directory', 'page_name', 'page_number', 'languages', 'filetype', 'category', 'element_id', 'last_modified'];
    const isSpreadsheetDoc = metadata.filename && (metadata.filename.endsWith('.xlsx') || metadata.filename.endsWith('.xls'));
    if (isSpreadsheetDoc && fieldsToHide.includes(key)) {
      return false;
    }
    return true;
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
          
          // Fix: Properly find the question path
          const questionPath = path.find((p, index) => {
            if (subActivityIndex === -1) return false;
            return index > subActivityIndex && p.match(/^\d+_[A-Za-z]/);
          });

          if (questionPath) {
            question = removeNumPrefix(questionPath);
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

  return (
    <div className="space-y-4 pb-6">
      <h3 className="text-lg font-medium mb-4 bg-white py-2">Retrieved Context Data</h3>

      {Object.entries(data).map(([key, value]) => {
        const displayKey = key.replace(/^[0-9]+_/, '');
        const isExpanded = expandedSections[key] ?? false;
        const contentItems = extractContentAndMetadata(value);

        // Format the display key with full form instead of abbreviations
        let formattedDisplayKey = displayKey;

        if (displayKey === 'PD') {
          formattedDisplayKey = 'Protocol Deviations';
        } else if (displayKey === 'AE_SAE') {
          formattedDisplayKey = 'Adverse Events / Serious Adverse Events';
        }

        return (
          <div key={key} className="border rounded-lg overflow-visible shadow-sm mb-4">
            <div 
              className="flex items-center justify-between p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => toggleSection(key)}
            >
              <div className="flex items-center space-x-2">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                <h4 className="font-medium text-blue-700">{formattedDisplayKey}</h4>
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
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-medium text-sm mr-2 shadow-sm">
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
                          {/* Display subActivity as Activity */}
                          {item.subActivity && (
                            <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                              <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                Activity
                              </td>
                              <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                {cleanSubactivityValue(item.subActivity)}
                              </td>
                            </tr>
                          )}

                          {/* Display question as Sub-activity */}
                          {item.question && (
                            <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                              <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                Sub-activity
                              </td>
                              <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                {item.question}
                              </td>
                            </tr>
                          )}

                          {/* Display relevance score if available */}
                          {item.relevanceScore !== undefined && (
                            <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                              <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                Relevance Score
                              </td>
                              <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${item.relevanceScore > 0.7 ? 'bg-green-100 text-green-800' : item.relevanceScore > 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {formatRelevanceScore(item.relevanceScore)}
                                </span>
                              </td>
                            </tr>
                          )}

                          {/* Display summary if available */}
                          {item.summary && (
                            <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                              <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                Summary
                              </td>
                              <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
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
                        <div className="overflow-x-auto border rounded shadow-sm">
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

                    {/* Content Section */}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
