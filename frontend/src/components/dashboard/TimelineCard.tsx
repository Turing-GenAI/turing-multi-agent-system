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
}

export const TimelineCard: React.FC = () => {
  const [q3TrialsAudited, setQ3TrialsAudited] = useState(1);
  const [q3OpenAlerts, setQ3OpenAlerts] = useState(1);
  const [showTrialsModal, setShowTrialsModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [trials, setTrials] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Start trials audited counter
    const trialsInterval = setInterval(() => {
      setQ3TrialsAudited(prev => prev < 30891 ? prev + 100 : prev);
    }, 100);

    // Start open alerts counter with a 6-second delay
    const openAlertsTimeout = setTimeout(() => {
      const alertsInterval = setInterval(() => {
        setQ3OpenAlerts(prev => prev < 162 ? prev + 1 : prev);
      }, 100);

      return () => clearInterval(alertsInterval);
    }, 6000);

    return () => {
      clearInterval(trialsInterval);
      clearTimeout(openAlertsTimeout);
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
      quarter: 'Q1 2024',
      ongoingTrials: 30542,
      trialsAudited: 30542,
      openAlerts: 14,
      completedAlerts: 120342
    },
    {
      quarter: 'Q2 2024',
      ongoingTrials: 30123,
      trialsAudited: 30123,
      openAlerts: 162,
      completedAlerts: 100322
    },
    {
      quarter: 'Q3 2024',
      ongoingTrials: 30891,
      trialsAudited: q3TrialsAudited,
      openAlerts: q3OpenAlerts,
      completedAlerts: 0
    }
  ];

  const handleTrialsClick = () => {
    const currentTrialsAudited = q3TrialsAudited;
    
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
      <h2 className="text-lg font-semibold mb-4">Clinical Trials Timeline</h2>
      
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
                    className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={handleTrialsClick}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FileCheck className="text-green-600 w-5 h-5" />
                      <span className="text-sm font-medium text-green-600">Trials Audited</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{point.trialsAudited.toLocaleString()}</p>
                  </div>

                  <div 
                    className="bg-yellow-50 p-4 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                    onClick={handleAlertsClick}
                  >
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
