import React, { useState, useMemo } from 'react';
import { AgentWindow } from '../components/AgentWindow';
import { SearchForm } from '../components/SearchForm';
import { FindingsTable } from '../components/FindingsTable';
import { mockResponses, pdFindings, aeFindings, sgrFindings, trials, sites } from '../data/mockData';
import { Message } from '../types';

type AgentType = 'trial_master' | 'inspection_master' | 'crm_master';

export const AuditPage: React.FC = () => {
  const SUGGESTION_TEXT = "Try asking about audit findings, specific trials, or inspection details...";

  const [selectedTrial, setSelectedTrial] = useState(trials[0]);
  const [selectedSite, setSelectedSite] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(2024, 10, 20),
    to: new Date(2024, 10, 20)
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAgentTab, setSelectedAgentTab] = useState<AgentType>('trial_master');
  const [messagesByAgent, setMessagesByAgent] = useState<Record<AgentType, Message[]>>({
    trial_master: [],
    inspection_master: [],
    crm_master: []
  });
  const [userInput, setUserInput] = useState<Record<AgentType, string>>({
    trial_master: '',
    inspection_master: '',
    crm_master: ''
  });
  const [selectedFindingTab, setSelectedFindingTab] = useState('pd');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [findings, setFindings] = useState<{
    pd: typeof pdFindings;
    ae: typeof aeFindings;
    sgr: typeof sgrFindings;
  }>({
    pd: [],
    ae: [],
    sgr: []
  });

  const availableSites = useMemo(() => {
    return sites[selectedTrial]?.map(site => site.id) || [];
  }, [selectedTrial]);

  const handleRunClick = () => {
    setIsProcessing(true);
    // Reset findings when starting new analysis
    setSelectedFindingTab('pd');
    setFindings({
      pd: [],
      ae: [],
      sgr: []
    });

    const progressSteps = [
      { id: '1', label: 'Analyzing Trial Data', status: 'pending' },
      { id: '2', label: 'Checking Protocol Deviations', status: 'pending' },
      { id: '3', label: 'Reviewing Adverse Events', status: 'pending' },
      { id: '4', label: 'Generating Safety Report', status: 'pending' }
    ];

    const toolMessage = {
      type: 'progress_steps',
      steps: progressSteps
    };

    // Add initial progress message
    const newMessage: Message = {
      id: Date.now().toString(),
      agent: 'trial_master_agent',
      content: JSON.stringify(toolMessage),
      timestamp: new Date(),
      isUser: false
    };

    // Reset any existing messages first
    setMessagesByAgent(prev => ({
      ...prev,
      [selectedAgentTab]: []
    }));

    setMessagesByAgent(prev => {
      const updated = {
        ...prev,
        [selectedAgentTab]: [...prev[selectedAgentTab], newMessage]
      };
      return updated;
    });

    // Simulate progress updates
    const updateStep = (stepIndex: number, status: 'in_progress' | 'completed') => {
      const updatedSteps = progressSteps.map((step, index) => ({
        ...step,
        status: index < stepIndex ? 'completed' : index === stepIndex ? status : 'pending'
      }));

      const updatedMessage: Message = {
        id: Date.now().toString(),
        agent: 'trial_master_agent',
        content: JSON.stringify({ type: 'progress_steps', steps: updatedSteps }),
        timestamp: new Date(),
        isUser: false
      };

      setMessagesByAgent(prev => ({
        ...prev,
        [selectedAgentTab]: [...prev[selectedAgentTab].slice(0, -1), updatedMessage]
      }));

      // Update findings when a step completes
      if (status === 'completed') {
        const step = progressSteps[stepIndex];
        const filteredFindings = (findings: typeof pdFindings) => 
          findings.filter(finding =>
            // (!selectedSite || finding.siteId === selectedSite)&&
            // finding.studyId === selectedTrial
            finding
          );

        if (step.id === '2') {
          console.log("setFindings called for id 2 : ", filteredFindings(pdFindings));
          setFindings(prev => ({
            ...prev,
            pd: filteredFindings(pdFindings)
          }));
          setSelectedFindingTab('pd');
        } else if (step.id === '3') {
          setFindings(prev => ({
            ...prev,
            ae: filteredFindings(aeFindings)
          }));
          setSelectedFindingTab('ae');
        } else if (step.id === '4') {
          setFindings(prev => ({
            ...prev,
            sgr: filteredFindings(sgrFindings)
          }));
          setSelectedFindingTab('sgr');
        }
      }
    };

    // Simulate the progress with delays
    setTimeout(() => updateStep(0, 'in_progress'), 100);
    setTimeout(() => {
      updateStep(0, 'completed');
      updateStep(1, 'in_progress');
    }, 2000);
    setTimeout(() => {
      updateStep(1, 'completed');
      updateStep(2, 'in_progress');
    }, 4000);
    setTimeout(() => {
      updateStep(2, 'completed');
      updateStep(3, 'in_progress');
    }, 6000);
    setTimeout(() => {
      updateStep(3, 'completed');
      
      // Add completion message
      const completionMessage: Message = {
        id: Date.now().toString(),
        agent: 'trial_master_agent',
        content: 'Analysis complete! Here are the findings:',
        timestamp: new Date(),
        isUser: false
      };

      setMessagesByAgent(prev => ({
        ...prev,
        [selectedAgentTab]: [...prev[selectedAgentTab], completionMessage]
      }));

      setIsProcessing(false);
    }, 8000);
  };

  const handleSendMessage = (agent: AgentType, e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput[agent].trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      agent,
      content: userInput[agent],
      timestamp: new Date(),
      isUser: true
    };

    setMessagesByAgent(prev => ({
      ...prev,
      [agent]: [...prev[agent], newMessage]
    }));
    setUserInput(prev => ({
      ...prev,
      [agent]: ''
    }));
    
    setTimeout(() => {
      const responses = mockResponses[`${agent}_agent`].responses;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        agent,
        content: randomResponse,
        timestamp: new Date()
      };

      setMessagesByAgent(prev => ({
        ...prev,
        [agent]: [...prev[agent], aiResponse]
      }));
    }, 1000);
  };

  const updateUserInput = (agent: AgentType, value: string) => {
    setUserInput(prev => ({
      ...prev,
      [agent]: value
    }));
  };

  const getCurrentFindings = () => {
    console.log("getCurrentFindings called...", selectedFindingTab, findings)
    switch (selectedFindingTab) {
      case 'pd':
        return findings.pd;
      case 'ae':
        return findings.ae;
      case 'sgr':
        return findings.sgr;
      default:
        return findings.pd;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-6">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <SearchForm
            selectedTrial={selectedTrial}
            setSelectedTrial={setSelectedTrial}
            selectedSite={selectedSite}
            setSelectedSite={setSelectedSite}
            dateRange={dateRange}
            setIsDatePickerOpen={setIsDatePickerOpen}
            isProcessing={isProcessing}
            handleRunClick={handleRunClick}
            sites={sites}
            trials={trials}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[600px]">
            <AgentWindow
              messages={messagesByAgent[selectedAgentTab]}
              userInput={userInput[selectedAgentTab]}
              updateUserInput={(value) => updateUserInput(selectedAgentTab, value)}
              handleSendMessage={(e) => handleSendMessage(selectedAgentTab, e)}
              suggestionText={SUGGESTION_TEXT}
            />
          </div>
          <div className="h-[600px]">
            <FindingsTable
              selectedFindingTab={selectedFindingTab}
              setSelectedFindingTab={setSelectedFindingTab}
              findings={getCurrentFindings()}
              expandedRows={expandedRows}
              setExpandedRows={setExpandedRows}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
