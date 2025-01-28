import React, { useState, useMemo, useEffect } from 'react';
import { AgentWindow } from '../components/AgentWindow';
import { SearchForm } from '../components/SearchForm';
import { FindingsTable } from '../components/FindingsTable';
import { mockResponses, pdFindings, aeFindings, sgrFindings, trials, sites } from '../data/mockData';
import { Finding, Message, AgentType } from '../types';

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
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
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
    pd: Array<{
      id: string;
      agent: string;
      content: string;
      timestamp: string;
    }>;
    ae: Array<{
      id: string;
      agent: string;
      content: string;
      timestamp: string;
    }>;
    sgr: Array<{
      id: string;
      agent: string;
      content: string;
      timestamp: string;
    }>;
  }>({
    pd: [],
    ae: [],
    sgr: []
  });

  const availableSites = useMemo(() => {
    return sites[selectedTrial]?.map(site => site.id) || [];
  }, [selectedTrial]);

  // Helper function to add delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchAIMessages = async (jobId: string, withFindings: boolean = false) => {
    try {
      const response = await fetch('/mockMessages.txt');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const mockData = await response.text();
      const data = { ai_messages: mockData };
      
      if (data.ai_messages === "Agent is processing!") {
        addAgentMessage(data.ai_messages, undefined, { agentPrefix: '', nodeName: '' });
      } else {
        const split_delimiters = [
          "================================== Ai Message ==================================", 
          "================================= Tool Message ================================="
        ];
        
        // Create a regex pattern that matches either delimiter
        const splitPattern = new RegExp(split_delimiters.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));
        const splittedMessages = data.ai_messages.split(splitPattern);

        // Process messages sequentially with delay
        for (const message of splittedMessages) {
          if (message.length > 0) {
            await delay(100); // 1 second delay between messages
            
            if (message.includes("Name:")) {
              const messageNode = message.split("Name: ")[1];
              // Split on first occurrence of either ":", ".", or newline
              const agentNode = messageNode.split(/[:.\r\n]/)[0]?.toLowerCase()??'';
              const agentPrefix = agentNode.split('-')[0]?.trim()??'';
              const nodeName = agentNode.split('-')[1]?.trim()?? '';
              const timestamp = new Date().toISOString();

              
              
              console.log("agentNode:", agentNode);

              // Skip processing if agentPrefix contains CRM or Trial Master
              if (agentPrefix.includes('crm') || agentPrefix.includes('trial') || nodeName.includes('tool')) {
                continue;
              }

              // Extract actual message content
              let content = messageNode || '';
              
              // Remove metadata and response info
              if (content.includes("content=")) {
                const parts = content.split("content=");
                if (parts.length > 1) {
                  const contentParts = parts[1].split("additional_kwargs=");
                  content = contentParts[0] || '';
                  // Remove quotes if present
                  content = content.replace(/^['"]|['"]$/g, '');
                }
              }
              
              // Clean up any remaining metadata
              content = content.replace(/\{[^}]+\}/g, '') // Remove JSON objects
                             .replace(/response_metadata=.*?(?=\n|$)/g, '') // Remove response metadata
                             .replace(/id='.*?'/g, '') // Remove IDs
                             .replace(/usage_metadata=.*?(?=\n|$)/g, '') // Remove usage metadata
                             .replace(/<class '.*?'>/g, '') // Remove class info
                             .trim();
              
              // Check if the message should go to findings table
              if (agentNode.includes("generate_response_agent") || 
                  agentNode.includes("generate_findings_agent")) {
                
                setFindings(prev => ({
                  ...prev,
                  pd: [...prev.pd, {
                    id: crypto.randomUUID(),
                    agent: nodeName || "findings",
                    content: content.trim(),
                    timestamp
                  }]
                }));
              } 
              // All other messages go to the chat window
              else {
                let cleanedContent = content;
                
                // Clean prefixes if present
                if (content.startsWith("trial supervisor - ")) {
                  cleanedContent = content.replace("trial supervisor - ", "").trim();
                } else if (content.startsWith("CRM - ")) {
                  cleanedContent = content.replace("CRM - ", "").trim();
                }
                
                addAgentMessage(cleanedContent.trim(), undefined, { agentPrefix, nodeName });
              }
            } else {
              addAgentMessage(message.trim(), undefined, { agentPrefix: '', nodeName: '' });
            }
          }
        }

        if (withFindings) {
          await delay(1500); // 1.5 second delay before final findings
          
          const timestamp = new Date().toISOString();
          const mockFindings = {
            PD: [
              {
                id: crypto.randomUUID(),
                agent: "inspection",
                content: "Protocol Deviation Finding: All identified protocol deviations were resolved within acceptable timeframes (2-4 weeks). Effective measures included enhanced training and re-consent procedures.",
                timestamp
              }
            ],
            AE: [
              {
                id: crypto.randomUUID(),
                agent: "inspection",
                content: "Adverse Events Finding: All AEs/SAEs have been properly documented with final dispositions and end dates in RAVE.",
                timestamp
              }
            ],
            SGR: []
          };

          // Add findings one by one
          for (const finding of mockFindings.PD) {
            await delay(800); // 0.8 second delay between findings
            setFindings(prev => ({
              ...prev,
              pd: [...prev.pd, finding]
            }));
          }
          
          for (const finding of mockFindings.AE) {
            await delay(800);
            setFindings(prev => ({
              ...prev,
              ae: [...prev.ae, finding]
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching mock messages:", error);
      addAgentMessage(`Error fetching mock messages: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, undefined, { agentPrefix: '', nodeName: '' });
    }
  };

  const checkJobStatus = async (jobId: string) => {
    try {
      // Simulate job status progression
      const currentStatus = jobStatus || 'queued';
      let newStatus = currentStatus;
      
      switch (currentStatus) {
        case 'queued':
          newStatus = 'processing';
          break;
        case 'processing':
          // Simulate job completion after a few cycles
          if (Math.random() > 0.7) {
            newStatus = 'completed';
          }
          break;
        default:
          newStatus = currentStatus;
      }
      
      setJobStatus(newStatus);
      return newStatus;
    } catch (error) {
      console.error("Error checking job status:", error);
      return null;
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (jobId) {
      checkJobStatus(jobId);
      fetchAIMessages(jobId, false);

      intervalId = setInterval(async () => {
        const status = await checkJobStatus(jobId);
        if (status === 'completed' || status === 'error') {
          clearInterval(intervalId);
          if (status === 'completed') {
            fetchAIMessages(jobId, true); 
          } else {
            addAgentMessage(`Analysis failed! Error: ${status}`, undefined, { agentPrefix: '', nodeName: '' });
            setIsProcessing(false);
          }
        } else {
          fetchAIMessages(jobId, false); 
        }
      }, 800000); 
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);

  const scheduleAnalysisJob = async () => {
    try {
      const formattedDateRange = `${dateRange.from.toISOString().split('T')[0]} - ${dateRange.to.toISOString().split('T')[0]}`;
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/schedule-job/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            site_id: selectedSite,
            trial_id: selectedTrial,
            date: formattedDateRange,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setJobId(data.job_id);
      setJobStatus('queued');
      
      addAgentMessage(`I've scheduled the Job for analysis! Job ID: ${data.job_id}`, undefined, { agentPrefix: '', nodeName: '' });
      
      return data.job_id;
    } catch (error) {
      console.error('Error scheduling analysis job:', error);
      
      addAgentMessage(`Error scheduling analysis job: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, undefined, { agentPrefix: '', nodeName: '' });
      
      throw error;
    }
  }

  const handleRunClick = async () => {
    setIsProcessing(true);
    setSelectedFindingTab('pd');
    setFindings({
      pd: [],
      ae: [],
      sgr: []
    });

    try {
      await scheduleAnalysisJob();
      addAgentMessage('Please select the Trial ID from the options below', 'trial', { agentPrefix: '', nodeName: '' });
      setIsProcessing(false);
    } catch (error) {
      console.error('Error running analysis:', error);
      setIsProcessing(false);
    }
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
    return [...findings.pd, ...findings.ae, ...findings.sgr];
  };

  const addAgentMessage = (
    message: string, 
    toolType?: 'trial' | 'site' | 'date' | 'button',
    options?: { 
      agentPrefix?: string;
      nodeName?: string;
    }
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      agent: 'trial_master_agent',
      content: toolType
        ? JSON.stringify({
            type: 'tool_ui',
            tool: {
              type: toolType,
              message,
              options: toolType === 'button' ? { buttonText: 'Yes, Proceed' } : undefined,
            },
          })
        : message,
      timestamp: new Date(),
      isUser: false,
      agentPrefix: options?.agentPrefix || '',
      nodeName: options?.nodeName || '',
    };

    setMessagesByAgent(prev => ({
      ...prev,
      [selectedAgentTab]: [...prev[selectedAgentTab], newMessage],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-2rem)]">
          <div className="h-full overflow-hidden">
            <AgentWindow
              messages={messagesByAgent[selectedAgentTab]}
              userInput={userInput[selectedAgentTab]}
              updateUserInput={(value) => setUserInput(prev => ({ ...prev, [selectedAgentTab]: value }))}
              handleSendMessage={(e) => handleSendMessage(selectedAgentTab, e)}
              trials={trials}
              sites={sites}
              onInputComplete={(data) => {
                setSelectedTrial(data.selectedTrial);
                setSelectedSite(data.selectedSite);
                setDateRange(data.dateRange as { from: Date; to: Date });
              }}
              handleRunClick={handleRunClick}
              addAgentMessage={addAgentMessage}
            />
          </div>
          <div className="h-full overflow-hidden">
            <FindingsTable
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
