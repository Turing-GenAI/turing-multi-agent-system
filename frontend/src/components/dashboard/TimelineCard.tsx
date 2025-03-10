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
  const [q4TrialsAudited, setQ4TrialsAudited] = useState(30891);
  const [q4OpenAlerts, setQ4OpenAlerts] = useState(162);
  const [showTrialsModal, setShowTrialsModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [trials, setTrials] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Update trials audited and open alerts every 5 seconds for Q1 2025
    const updateInterval = setInterval(() => {
      // Random increment between 1-3 for trials audited
      const trialsIncrement = Math.floor(Math.random() * 3) + 1;
      setQ4TrialsAudited(prev => prev + trialsIncrement);
      
      // Random increment between 1-10 for open alerts
      const alertsIncrement = Math.floor(Math.random() * 10) + 1;
      setQ4OpenAlerts(prev => prev + alertsIncrement);
    }, 5000);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  useEffect(() => {
    if (!showTrialsModal) return;

    // Update progress for live trials at different speeds
    const progressIntervals = trials
      .filter(trial => trial.isLive)
      .map(trial => {
        const speed = Math.random() * (2000 - 500) + 500; // Random speed between 500ms and 2000ms
        return setInterval(() => {
          setTrials(prevTrials =>
            prevTrials.map(t =>
              t.id === trial.id && t.progress < 100
                ? { ...t, progress: Math.min(t.progress + (Math.random() * 5 + 1), 100) }
                : t
            )
          );
        }, speed);
      });

    return () => {
      progressIntervals.forEach(interval => clearInterval(interval));
    };
  }, [showTrialsModal, trials]);

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
      openAlerts: 162,
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

  const handleTrialsClick = () => {
    const currentTrialsAudited = q4TrialsAudited;
    
    // Generate trials with decreasing numbers
    const liveTrials = Array.from({ length: 25 }, (_, i) => ({
      id: `TRIAL-${i + 1}`,
      name: `Clinical Trial ${currentTrialsAudited - i}`,
      progress: 0,
      isLive: true,
      number: currentTrialsAudited - i
    }));

    const completedTrials = Array.from({ length: 100 }, (_, i) => ({
      id: `TRIAL-${i + 26}`,
      name: `Clinical Trial ${currentTrialsAudited - (i + 25)}`,
      progress: 100,
      isLive: false,
      number: currentTrialsAudited - (i + 25)
    }));

    setTrials([...liveTrials, ...completedTrials]);
    setShowTrialsModal(true);
  };

  const handleAlertsClick = () => {
    // Generate random alerts data
    const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
    const countries = {
      'North America': ['USA', 'Canada'],
      'Europe': ['UK', 'Germany', 'France', 'Spain'],
      'Asia Pacific': ['Japan', 'China', 'Australia', 'South Korea'],
      'Latin America': ['Brazil', 'Mexico', 'Argentina']
    };
    const statuses: ('In Progress' | 'Completed' | 'On Hold')[] = ['In Progress', 'Completed', 'On Hold'];

    const newAlerts = Array.from({ length: 50 }, (_, i) => {
      const region = regions[Math.floor(Math.random() * regions.length)];
      return {
        trialId: `TRIAL-${30000 - i}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        region,
        country: countries[region][Math.floor(Math.random() * countries[region].length)],
        pdAlerts: Math.floor(Math.random() * 5),
        aeAlerts: Math.floor(Math.random() * 8),
        cssAlerts: Math.floor(Math.random() * 4),
        sgrAlerts: Math.floor(Math.random() * 3)
      };
    });

    setAlerts(newAlerts);
    setShowAlertsModal(true);
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
          alerts={alerts} 
          onClose={() => setShowAlertsModal(false)} 
        />
      )}
    </div>
  );
};
