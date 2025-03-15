import React, { useState, useEffect } from 'react';
import { X, CheckCircle, FileCheck } from 'lucide-react';

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
  // Track trials that have transitioned to completed state
  const [animatingTrials, setAnimatingTrials] = useState<Set<string>>(new Set());
  const [completedTrialIds, setCompletedTrialIds] = useState<Set<string>>(new Set());
  
  // Separate trials into in-progress and completed
  const inProgressTrials = trials.filter(trial => trial.isLive);
  const completedTrials = trials.filter(trial => !trial.isLive);
  
  // Initialize completedTrialIds with all initially completed trials on mount
  useEffect(() => {
    // Get all initially completed trials
    const initialCompletedTrials = trials.filter(trial => !trial.isLive);
    
    if (initialCompletedTrials.length > 0) {
      // Add all initially completed trial IDs to the set immediately
      setCompletedTrialIds(prev => {
        const updated = new Set(prev);
        initialCompletedTrials.forEach(trial => {
          updated.add(trial.id);
        });
        return updated;
      });
    }
  }, []); // Empty dependency array means this runs once on mount
  
  // Track when trials reach 100% to trigger animations
  useEffect(() => {
    // Find trials that are about to complete (>= 95% progress)
    const aboutToComplete = trials.filter(trial => 
      trial.isLive && trial.progress >= 98 && !animatingTrials.has(trial.id)
    );
    
    if (aboutToComplete.length > 0) {
      // Stagger animations slightly for multiple completing trials
      aboutToComplete.forEach((trial, index) => {
        setTimeout(() => {
          setAnimatingTrials(prev => {
            const updated = new Set(prev);
            updated.add(trial.id);
            return updated;
          });
        }, index * 150); // Stagger by 150ms per trial
      });
    }
    
    // Find newly completed trials
    const newlyCompleted = trials.filter(trial => 
      !trial.isLive && !completedTrialIds.has(trial.id)
    );
    
    if (newlyCompleted.length > 0) {
      // Stagger the appearance in completed column
      newlyCompleted.forEach((trial, index) => {
        setTimeout(() => {
          setCompletedTrialIds(prev => {
            const updated = new Set(prev);
            updated.add(trial.id);
            return updated;
          });
        }, 400 + (index * 150)); // Base delay + stagger
      });
    }
  }, [trials, animatingTrials]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-[90vw] max-w-[1200px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <FileCheck className="w-5 h-5 mr-2 text-green-600" />
            Trials Audit Progress
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 flex">
          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-6 w-full">
            {/* Left column - In Progress */}
            <div className="p-4 border-r">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                In Progress Trials 
                <span className="ml-2 px-2 py-0.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  {inProgressTrials.length}
                </span>
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                {inProgressTrials.length > 0 ? (
                  inProgressTrials
                    .sort((a, b) => a.number - b.number)
                    .map(trial => (
                      <div 
                        key={trial.id} 
                        className={`
                          bg-blue-50 p-4 rounded-lg transition-all duration-500
                          ${animatingTrials.has(trial.id) ? 'animate-slide-right' : ''}
                        `}
                        onAnimationEnd={() => {
                          if (animatingTrials.has(trial.id)) {
                            setAnimatingTrials(prev => {
                              const updated = new Set(prev);
                              updated.delete(trial.id);
                              return updated;
                            });
                          }
                        }}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{trial.name}</span>
                          <span className="text-blue-600">{Math.round(trial.progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ 
                              width: `${trial.progress}%`,
                              transition: 'width 50ms linear'
                            }}
                          />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-gray-500 italic text-center py-4">
                    No trials in progress
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Completed */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                Completed Trials 
                <span className="ml-2 px-2 py-0.5 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  {completedTrials.length}
                </span>
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                {completedTrials
                  .sort((a, b) => b.number - a.number) // Reverse sort order to show highest trial numbers (most recent) first
                  .map(trial => (
                    <div 
                      key={trial.id} 
                      className={`
                        bg-green-50 p-4 rounded-lg transition-all duration-500
                        ${completedTrialIds.has(trial.id) ? 'animate-fade-in' : 'opacity-0'}
                      `}
                    >
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{trial.name}</span>
                          <span className="text-green-600 flex items-center gap-1 text-sm">
                            <CheckCircle className="w-4 h-4" /> Completed
                          </span>
                        </div>
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

      {/* Add CSS animations as a string in the style tag */}
      <style>
        {`
        @keyframes slide-right {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(50%); opacity: 0; }
        }
        .animate-slide-right {
          animation: slide-right 0.5s ease-out forwards;
        }
        
        @keyframes fade-in {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        `}
      </style>
    </div>
  );
};
