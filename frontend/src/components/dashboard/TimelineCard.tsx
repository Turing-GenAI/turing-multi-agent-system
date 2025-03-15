import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, FileCheck, X } from 'lucide-react';
import { TrialsAuditCard } from './TrialsAuditCard';
import { AlertsCard } from './AlertsCard';

interface TimelinePoint {
  quarter: string;
  ongoingTrials: number;
  trialsAudited: number;
  openAlerts: number;
  completedAlerts: number;
  isLive?: boolean;
}

export const TimelineCard: React.FC = () => {
  const [q4TrialsAudited, setQ4TrialsAudited] = useState(100);
  const [q4OpenAlerts, setQ4OpenAlerts] = useState(15);
  const [showTrialsModal, setShowTrialsModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [trials, setTrials] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Only keep the random increment for open alerts
    const updateInterval = setInterval(() => {
      // Random increment between 1-10 for open alerts
      const alertsIncrement = Math.floor(Math.random() * 10) + 1;
      setQ4OpenAlerts(prev => prev + alertsIncrement);
    }, 5000);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  // Add a useEffect to update trials audited count based on actual completed trials
  useEffect(() => {
    // Update the trials audited count based on the actual number of completed trials
    const completedTrialsCount = trials.filter(t => !t.isLive).length;
    
    // Only update if there are completed trials and it's different from current count
    if (completedTrialsCount > 0) {
      setQ4TrialsAudited(completedTrialsCount);
    }
  }, [trials]);

  // Generate trial data if empty
  useEffect(() => {
    if (trials.length === 0) {
      // Create initial trials data - all start at 0% when modal opens
      const newTrials = [
        // In-progress trials starting from trial 101
        ...Array(10).fill(null).map((_, index) => ({
          id: `trial-${index + 101}`,
          name: generateTrialId(index + 101),
          number: index + 101,
          progress: 0,
          isLive: true,
          startTime: 0, // Will be set when modal opens
        })),
        
        // Already completed trials (first 100 trials)
        ...Array(100).fill(null).map((_, index) => ({
          id: `trial-${index + 1}`,
          name: generateTrialId(index + 1),
          number: index + 1,
          progress: 100,
          isLive: false,
        })),
      ];
      
      setTrials(newTrials);
    }
  }, [trials]);

  // Initialize start times when modal opens
  useEffect(() => {
    if (showTrialsModal) {
      // Reset progress and set start times only when opening the modal
      // This is just for visualization purposes
      const modalOpenTime = Date.now();
      
      setTrials(prevTrials => {
        return prevTrials.map(trial => {
          if (trial.isLive) {
            // Randomize start delay (0-4 seconds) for each trial
            const startDelay = Math.floor(Math.random() * 4000);
            return {
              ...trial,
              progress: 0, // Reset progress to 0
              startTime: modalOpenTime + startDelay, // Start in the future
            };
          }
          return trial;
        });
      });
    }
  }, [showTrialsModal]);

  // Handle trial progress updates - each trial takes exactly 5 seconds
  useEffect(() => {
    // Initialize trial startTimes if they haven't been set yet
    setTrials(prevTrials => {
      const currentTime = Date.now();
      
      // Only initialize trials that don't have a startTime yet
      if (prevTrials.some(trial => trial.isLive && !trial.startTime)) {
        return prevTrials.map(trial => {
          if (trial.isLive && !trial.startTime) {
            // Random start delay between 0-4 seconds
            const startDelay = Math.floor(Math.random() * 4000);
            return {
              ...trial,
              startTime: currentTime + startDelay
            };
          }
          return trial;
        });
      }
      
      return prevTrials;
    });

    // Main timer for updating all trial progress
    const progressInterval = setInterval(() => {
      const currentTime = Date.now();
      
      setTrials(prevTrials => {
        // Create a copy of the current trials
        let updatedTrials = [...prevTrials];
        
        // Update progress for existing trials
        updatedTrials = updatedTrials.map(trial => {
          // Skip already completed trials
          if (!trial.isLive) {
            return trial;
          }
          
          // Skip trials that haven't started yet
          if (currentTime < trial.startTime) {
            return trial;
          }
          
          // Calculate elapsed time since this trial's start
          const elapsedTime = currentTime - trial.startTime;
          
          // Calculate progress based on exactly 5-second timeline
          const progressPercent = Math.min((elapsedTime / 5000) * 100, 100);
          
          // Ensure the progress number is a clean integer
          const displayProgress = Math.min(Math.floor(progressPercent), 100);
          
          // Check if trial should complete (exactly at 5 seconds)
          if (elapsedTime >= 5000) {
            return { ...trial, progress: 100, isLive: false };
          }
          
          // Just update progress
          return { ...trial, progress: displayProgress };
        });
        
        // Check if we need to add a new trial (when one completes)
        const completedCount = updatedTrials.filter(t => !t.isLive).length;
        const inProgressCount = updatedTrials.filter(t => t.isLive).length;
        
        // Find the highest trial number currently in the system
        const highestTrialNumber = Math.max(...updatedTrials.map(t => t.number));
        
        // If we have fewer than 10 in-progress trials, add a new one
        if (inProgressCount < 10) {
          // Create a new trial with the next number (up to ~31,000)
          const newTrialNumber = Math.min(highestTrialNumber + 1, 31000);
          
          // Only add a new trial if we haven't reached 31,000 yet
          if (newTrialNumber < 31000) {
            const newTrial = {
              id: `trial-${newTrialNumber}`,
              name: generateTrialId(newTrialNumber),
              number: newTrialNumber,
              progress: 0,
              isLive: true,
              startTime: currentTime + Math.floor(Math.random() * 2000), // Start in 0-2 seconds
            };
            
            updatedTrials.push(newTrial);
          }
        }
        
        return updatedTrials;
      });
    }, 50); // Update every 50ms for smooth animation

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  const handleTrialsClick = () => {
    setShowTrialsModal(true);
  };

  const handleAlertsClick = () => {
    // Generate random alerts data
    const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'] as const;
    type Region = typeof regions[number];
    
    const countries: Record<Region, string[]> = {
      'North America': ['USA', 'Canada'],
      'Europe': ['UK', 'Germany', 'France', 'Spain'],
      'Asia Pacific': ['Japan', 'China', 'Australia', 'South Korea'],
      'Latin America': ['Brazil', 'Mexico', 'Argentina']
    };
    const statuses: ('In Progress' | 'Completed')[] = ['In Progress', 'Completed'];

    // Start from trial number 100 and scale up to approximately 30,000
    // Always have some trials in "In Progress" status (10-20 trials)
    const inProgressCount = 10 + Math.floor(Math.random() * 10); // 10-20 trials in progress
    const completedCount = 100; // Show 100 completed trials initially
    
    // Generate completed trials (first 100 trials)
    const completedAlerts = Array.from({ length: completedCount }, (_, i) => {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const trialNumber = i + 1; // Trials 1-100 are completed
      const trialId = generateTrialId(trialNumber);
      return {
        trialId,
        status: 'Completed' as const,
        region,
        country: countries[region][Math.floor(Math.random() * countries[region].length)],
        pdAlerts: Math.floor(Math.random() * 5),
        aeAlerts: Math.floor(Math.random() * 8),
        cssAlerts: Math.floor(Math.random() * 4),
        sgrAlerts: Math.floor(Math.random() * 3)
      };
    });
    
    // Generate in-progress trials (starting from 101)
    const inProgressAlerts = Array.from({ length: inProgressCount }, (_, i) => {
      const region = regions[Math.floor(Math.random() * regions.length)];
      // Start from 101 and randomly distribute up to ~30,000
      const trialNumber = 101 + Math.floor(Math.random() * 29900);
      const trialId = generateTrialId(trialNumber);
      return {
        trialId,
        status: 'In Progress' as const,
        region,
        country: countries[region][Math.floor(Math.random() * countries[region].length)],
        pdAlerts: Math.floor(Math.random() * 5),
        aeAlerts: Math.floor(Math.random() * 8),
        cssAlerts: Math.floor(Math.random() * 4),
        sgrAlerts: Math.floor(Math.random() * 3)
      };
    });

    // Combine and sort the alerts
    const newAlerts = [...inProgressAlerts, ...completedAlerts].sort((a, b) => {
      // Sort by status first (In Progress first)
      if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
      if (a.status !== 'In Progress' && b.status === 'In Progress') return 1;
      
      // Then sort by trial number (extract number from trialId)
      const aNum = getTrialIndex(a.trialId);
      const bNum = getTrialIndex(b.trialId);
      return aNum - bNum;
    });

    setAlerts(newAlerts);
    setShowAlertsModal(true);
  };

  const timelineData: TimelinePoint[] = [
    {
      quarter: 'Q2 2024',
      ongoingTrials: 30542,
      trialsAudited: 30542,
      openAlerts: 14,
      completedAlerts: 120342
    },
    {
      quarter: 'Q3 2024',
      ongoingTrials: 30123,
      trialsAudited: 30123,
      openAlerts: 162,
      completedAlerts: 100322
    },
    {
      quarter: 'Q4 2024',
      ongoingTrials: 30891,
      trialsAudited: 30891,
      openAlerts: 125,
      completedAlerts: 80123
    },
    {
      quarter: 'Q1 2025 (Till Date)',
      ongoingTrials: 31000,
      trialsAudited: q4TrialsAudited,
      openAlerts: q4OpenAlerts,
      completedAlerts: 20000,
      isLive: true
    }
  ];

  // Helper function to generate realistic trial IDs based on provided examples
  const generateTrialId = (index: number): string => {
    // Trial ID prefixes - mix of numeric and alphabetic options
    const numericPrefixes = ['54767414', '90014496', '70033093', '63733657', '42847922'];
    const alphabeticPrefixes = ['CNTO1275', 'RIVAROX', 'VAC18193', 'VAC18194'];
    
    // Disease/study codes
    const diseaseCodes = ['AMY', 'LYM', 'PUC', 'DMY', 'ACS', 'HFA', 'RSV', 'ALZ', 'MDD'];
    
    // Generate a random ID with the appropriate structure
    const useNumericPrefix = Math.random() > 0.4; // 60% chance of alphabetic prefix
    
    let prefix;
    if (useNumericPrefix) {
      prefix = numericPrefixes[Math.floor(Math.random() * numericPrefixes.length)];
    } else {
      prefix = alphabeticPrefixes[Math.floor(Math.random() * alphabeticPrefixes.length)];
    }
    
    const diseaseCode = diseaseCodes[Math.floor(Math.random() * diseaseCodes.length)];
    
    // Phase is usually 2 or 3, with 3 more likely for larger studies
    const phase = Math.random() > 0.3 ? '3' : '2';
    
    // Format the sequential number based on index, with padding
    const sequentialNumber = String(index % 1000).padStart(3, '0');
    
    return `${prefix}${diseaseCode}${phase}${sequentialNumber}`;
  };

  // Function to convert a trial ID to a numeric index for maintaining the ordering logic
  const getTrialIndex = (trialId: string): number => {
    // Extract the last 3 digits if possible, or return a random large number
    const match = trialId.match(/(\d{3})$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Fallback for incompatible formats
    return Math.floor(Math.random() * 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* <h2 className="text-lg font-semibold mb-4">Clinical Trials Timeline</h2> */}
      
      <div className="relative px-8">
        {/* Timeline line */}
        <div className="absolute left-8 right-8 top-[50px] h-1 bg-blue-500"></div>

        {/* Timeline points */}
        <div className="flex justify-between">
          {timelineData.map((point, index) => (
            <div key={point.quarter} className="relative flex-1 px-4">
              {/* Timeline dot */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[42px] w-[18px] h-[18px] bg-blue-500 rounded-full"></div>

              {/* Content */}
              <div className="text-center mb-16">
                <h2 className="text-xl font-semibold text-gray-700 mb-12">{point.quarter}</h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="text-blue-600 w-5 h-5" />
                      <span className="text-sm font-medium text-blue-600">Ongoing Trials</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{point.ongoingTrials.toLocaleString()}</p>
                  </div>

                  <div 
                    className={`bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors ${point.isLive ? 'relative overflow-hidden' : ''}`}
                    onClick={handleTrialsClick}
                  >
                    {point.isLive && (
                      <div className="absolute top-0 right-0 w-3 h-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FileCheck className="text-green-600 w-5 h-5" />
                      <span className="text-sm font-medium text-green-600">Trials Audited</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{point.trialsAudited.toLocaleString()}</p>
                  </div>

                  <div 
                    className={`bg-yellow-50 p-4 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors ${point.isLive ? 'relative overflow-hidden' : ''}`}
                    onClick={handleAlertsClick}
                  >
                    {point.isLive && (
                      <div className="absolute top-0 right-0 w-3 h-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle className="text-yellow-600 w-5 h-5" />
                      <span className="text-sm font-medium text-yellow-600">Open Alerts</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{point.openAlerts.toLocaleString()}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="text-purple-600 w-5 h-5" />
                      <span className="text-sm font-medium text-purple-600">Completed Alerts</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{point.completedAlerts.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showTrialsModal && (
        <TrialsAuditCard 
          trials={trials} 
          onClose={() => setShowTrialsModal(false)} 
        />
      )}

      {showAlertsModal && (
        <AlertsCard 
          alerts={alerts.filter(alert => alert.status === 'In Progress' || alert.status === 'Completed')} 
          onClose={() => setShowAlertsModal(false)} 
        />
      )}
    </div>
  );
};
