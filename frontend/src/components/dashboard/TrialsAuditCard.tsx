import React from 'react';
import { X } from 'lucide-react';

interface Trial {
  id: string;
  name: string;
  progress: number;
  isLive: boolean;
  number: number;
}

interface TrialsAuditCardProps {
  trials: Trial[];
  onClose: () => void;
}

export const TrialsAuditCard: React.FC<TrialsAuditCardProps> = ({ trials, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Trials Audit Progress</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">In Progress Trials</h3>
              <div className="space-y-4">
                {trials
                  .filter(trial => trial.isLive)
                  .map(trial => (
                    <div key={trial.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Trial #{trial.number}</span>
                        <span className="text-green-600">{Math.round(trial.progress)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${trial.progress}%` }}
                        />
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Completed Trials</h3>
              <div className="space-y-4">
                {trials
                  .filter(trial => !trial.isLive)
                  .map(trial => (
                    <div key={trial.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Trial #{trial.number}</span>
                        <span className="text-green-600">100%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-full" />
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
