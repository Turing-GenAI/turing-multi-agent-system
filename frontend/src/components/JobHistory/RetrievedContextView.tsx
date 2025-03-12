import React from 'react';
import { Database } from 'lucide-react';
import { ProcessedContext } from './types';

interface RetrievedContextViewProps {
  context: ProcessedContext | null;
  loading: boolean;
}

const RetrievedContextView: React.FC<RetrievedContextViewProps> = ({ context, loading }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
        <Database className="w-5 h-5 mr-2" />
        Retrieved Context
      </h3>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !context || !context.chunks || context.chunks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No retrieved context available for this job</p>
        </div>
      ) : (
        <div className="space-y-4">
          {context.chunks.map((chunk, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                chunk.category === 'PD' 
                  ? 'bg-yellow-50 border-yellow-100' 
                  : chunk.category === 'AE' 
                    ? 'bg-orange-50 border-orange-100' 
                    : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                {chunk.activity && (
                  <div className="px-2 py-1 bg-white rounded text-xs font-medium">
                    <span className="font-bold">Activity:</span> {chunk.activity}
                  </div>
                )}
                {chunk.subActivity && (
                  <div className="px-2 py-1 bg-white rounded text-xs font-medium">
                    <span className="font-bold">Sub-activity:</span> {chunk.subActivity}
                  </div>
                )}
                {chunk.source && (
                  <div className="px-2 py-1 bg-white rounded text-xs font-medium">
                    <span className="font-bold">Source:</span> {chunk.source}
                  </div>
                )}
                {chunk.category && (
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    chunk.category === 'PD' 
                      ? 'bg-yellow-200 text-yellow-800' 
                      : chunk.category === 'AE' 
                        ? 'bg-orange-200 text-orange-800' 
                        : 'bg-gray-200 text-gray-800'
                  }`}>
                    {chunk.category}
                  </div>
                )}
              </div>
              
              <div className="bg-white p-3 rounded border">
                <p className="whitespace-pre-wrap">{chunk.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RetrievedContextView;
