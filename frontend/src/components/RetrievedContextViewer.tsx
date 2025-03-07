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

  return (
    <div className="space-y-4 pb-6">
      <h3 className="text-lg font-medium mb-4 bg-white py-2">Retrieved Context Data</h3>
      
      {Object.entries(data).map(([key, value]) => {
        const displayKey = key.replace(/^[0-9]+_/, '');
        const isExpanded = expandedSections[key] ?? false;
        const contentItems = extractContentAndMetadata(value);
        
        return (
          <div key={key} className="border rounded-lg overflow-visible shadow-sm mb-4">
            <div 
              className="flex items-center justify-between p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => toggleSection(key)}
            >
              <div className="flex items-center space-x-2">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                <h4 className="font-medium text-blue-700">{displayKey}</h4>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {contentItems.length} {contentItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {contentItems.map((item, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
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
