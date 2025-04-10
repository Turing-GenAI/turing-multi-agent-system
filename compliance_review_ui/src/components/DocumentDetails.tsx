import React from 'react';
import { FiX, FiCheck, FiExternalLink } from 'react-icons/fi';

interface Warning {
  id: number;
  text: string;
  current: string;
  suggested: string;
  regulation: string;
}

interface DocumentDetailsProps {
  document: {
    id: number;
    title: string;
    content: string;
    warnings: Warning[];
  };
  onClose: () => void;
}

export const DocumentDetails: React.FC<DocumentDetailsProps> = ({ document, onClose }) => {
  return (
    <div className="flex-1 bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{document.title}</h2>
          <span className="text-sm text-gray-500">#{document.id}</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 h-[calc(100vh-64px)]">
        {/* Document Content */}
        <div className="border-r overflow-auto p-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: document.content }} />
          </div>
        </div>

        {/* Warnings and Compliance */}
        <div className="overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Warnings ({document.warnings.length})</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Finalize review
              </button>
            </div>

            <div className="space-y-6">
              {document.warnings.map((warning, index) => (
                <div key={warning.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">#{index + 1} Sentence is inaccurate</h4>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50">
                        <FiCheck className="w-4 h-4" />
                        Accept
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50">
                        <FiX className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current:</p>
                      <p className="text-sm">{warning.current}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Suggested:</p>
                      <p className="text-sm">{warning.suggested}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Relevant compliance</h5>
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{warning.regulation}</span>
                        <button className="text-gray-500 hover:text-gray-700">
                          <FiExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 