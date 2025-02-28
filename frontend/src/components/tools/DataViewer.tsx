import React, { useState } from 'react';
import { FileText, Database, X, ChevronRight, ChevronDown, Download } from 'lucide-react';

interface DataViewerProps {
  data: any;
  onClose: () => void;
}

export const DataViewer: React.FC<DataViewerProps> = ({ data, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    content: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Extract metadata from the data object
  const metadata = {
    source: data.source || 'Unknown source',
    filename: data.filename || 'Unknown file',
    fileDirectory: data.file_directory || 'Unknown directory',
    lastModified: data.last_modified || 'Unknown date',
    pageName: data.page_name || 'Unknown page',
    pageNumber: data.page_number || 1,
    fileType: data.filetype || 'Unknown type',
    category: data.category || 'Unknown category',
  };

  // Function to download data as JSON
  const downloadData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.filename || 'data'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Enhanced table styling for better readability
  const enhanceTableFormatting = (htmlContent: string): string => {
    if (!htmlContent) return '';
    
    // Add CSS styles for better table formatting
    const styledHtml = `
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        th, td {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          text-align: left;
          vertical-align: top;
          max-width: 300px;
          overflow-wrap: break-word;
        }
        th {
          background-color: #f8fafc;
          font-weight: 600;
          position: sticky;
          top: 0;
        }
        tr:nth-child(even) {
          background-color: #f1f5f9;
        }
        tr:hover {
          background-color: #e2e8f0;
        }
        .table-container {
          max-height: 600px;
          overflow-y: auto;
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
        }
      </style>
      <div class="table-container">
        ${htmlContent}
      </div>
    `;
    
    return styledHtml;
  };

  // Convert the first row of the table to header cells
  const convertFirstRowToHeaders = (htmlContent: string): string => {
    if (!htmlContent) return '';
    
    // Replace the first row's td elements with th elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const table = doc.querySelector('table');
    if (table) {
      const firstRow = table.querySelector('tbody tr:first-child');
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td');
        cells.forEach(cell => {
          const th = doc.createElement('th');
          th.innerHTML = cell.innerHTML;
          cell.parentNode?.replaceChild(th, cell);
        });
      }
    }
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc.body);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">Data Viewer</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Metadata Section */}
          <div className="mb-4 border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleSection('metadata')}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium text-gray-800">File Metadata</h3>
              </div>
              {expandedSections.metadata ? 
                <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                <ChevronRight className="h-4 w-4 text-gray-500" />
              }
            </div>
            
            {expandedSections.metadata && (
              <div className="p-4 bg-white border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm text-gray-800 break-all">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleSection('content')}
            >
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium text-gray-800">Data Content</h3>
              </div>
              {expandedSections.content ? 
                <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                <ChevronRight className="h-4 w-4 text-gray-500" />
              }
            </div>
            
            {expandedSections.content && (
              <div className="p-4 bg-white border-t overflow-auto max-h-[50vh]">
                {data.text_as_html ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: enhanceTableFormatting(convertFirstRowToHeaders(data.text_as_html)) }}
                  />
                ) : (
                  <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={downloadData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
