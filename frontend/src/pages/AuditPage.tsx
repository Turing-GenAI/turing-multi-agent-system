import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AgentWindow } from '../components/AgentWindow';
import { SearchForm } from '../components/SearchForm';
import { FindingsTable } from '../components/FindingsTable';
import { mockResponses, pdFindings, aeFindings, sgrFindings, trials, sites } from '../data/mockData';
import { Finding, Message, AgentType } from '../types';
import { Home, FileText, AlertCircle, Settings, HelpCircle, Menu } from 'lucide-react';
import { auditService } from '../api/services/auditService'; // Import the audit service
import { TreeNode } from '../data/activities';

// Set this to true to skip message streaming animation (for debugging)
const SKIP_ANIMATION = false;

// Delay settings for normal and debug modes
const DELAYS = {
  NORMAL: {
    ANIMATION_DURATION: 200,
    MESSAGE_DELAY: 1000
  },
  DEBUG: {
    ANIMATION_DURATION: 0,
    MESSAGE_DELAY: 50  // minimal delay to ensure UI updates properly
  }
};

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

  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());
  const previousAIMessagesRef = useRef<string>('');

  const [progressTree, setProgressTree] = useState<TreeNode | null>(null);
  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNode | null>(null);

  const isMessageProcessed = (content: string, nodeName: string) => {
    const messageId = `${nodeName}-${content}`.trim();
    return processedMessageIds.has(messageId);
  };

  const markMessageAsProcessed = (content: string, nodeName: string) => {
    const messageId = `${nodeName}-${content}`.trim();
    setProcessedMessageIds(prev => new Set([...prev, messageId]));
  };

  const getNewMessages = (currentMessages: string, previousMessages: string): string => {
    console.log("newMessages check - previous:", previousMessages ? previousMessages.length : 0, "current:", currentMessages.length);
    // If previous messages is empty, all messages are new
    if (!previousMessages) return currentMessages;
    
    // Find the point where the strings start to differ
    let i = 0;
    while (i < previousMessages.length && previousMessages[i] === currentMessages[i]) {
      i++;
    }
    
    console.log("currentMessages slice:", currentMessages.slice(i).length);
    // Return the new content
    return currentMessages.slice(i);
  };

  const availableSites = useMemo(() => {
    return sites[selectedTrial]?.map(site => site.id) || [];
  }, [selectedTrial]);

  // Helper function to add delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Queue to store pending messages
  const [messageQueue, setMessageQueue] = useState<Array<{
    message: string;
    toolType?: 'trial' | 'site' | 'date' | 'button' | 'progresstree';
    options?: {
      value?: unknown;
      agentPrefix?: string;
      nodeName?: string;
      messageId?: string;  // Optional ID for updating existing messages
    };
  }>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Process messages in queue
  useEffect(() => {
    const processQueue = async () => {
      if (messageQueue.length > 0 && !isProcessingQueue) {
        setIsProcessingQueue(true);
        const { message, toolType, options, messageId } = messageQueue[0];

        
        // For tool UI messages, add or update them instantly
        if (toolType) {
          const newMessage: Message = {
            id: messageId,
            agent: 'trial_master_agent',
            content: JSON.stringify({
              type: 'tool_ui',
              tool: {
                type: toolType,
                message,
                options: options || (toolType === 'button' ? { buttonText: 'Yes, Proceed' } : undefined),
              },
            }),
            timestamp: new Date(),
            isUser: false,
            nodeName: options?.nodeName || '',
          };

          const cont = JSON.stringify({
            type: 'tool_ui',
            tool: {
              type: toolType,
              message,
              options: options || (toolType === 'button' ? { buttonText: 'Yes, Proceed' } : undefined),
            },
          });
          console.log("processQueue : ",  cont, ', newMessage: ', JSON.stringify(newMessage))
          setMessagesByAgent(prev => ({
            ...prev,
            [selectedAgentTab]: prev[selectedAgentTab].some(msg => msg.id === messageId)
              ? prev[selectedAgentTab].map(msg => msg.id === messageId ? newMessage : msg)
              : [...prev[selectedAgentTab], newMessage],
          }));

          console.log("processQueue, setMessageByAgent: ", messagesByAgent)
          setMessageQueue(prev => prev.slice(1));
          setIsProcessingQueue(false);
          return;
        }

        // For regular messages, either stream them or add instantly based on SKIP_ANIMATION
        const newMessage: Message = {
          id: messageId,
          agent: 'trial_master_agent',
          content: SKIP_ANIMATION ? message : '', // If skipping animation, add full content immediately
          timestamp: new Date(),
          isUser: false,
          nodeName: options?.nodeName || '',
        };

        setMessagesByAgent(prev => ({
          ...prev,
          [selectedAgentTab]: prev[selectedAgentTab].some(msg => msg.id === messageId)
            ? prev[selectedAgentTab].map(msg => msg.id === messageId ? newMessage : msg)
            : [...prev[selectedAgentTab], newMessage],
        }));

        if (!SKIP_ANIMATION) {
          // Stream the content character by character with dynamic speed
          const { ANIMATION_DURATION, MESSAGE_DELAY } = DELAYS.NORMAL;
          const chars = message.split('');
          const delayPerChar = ANIMATION_DURATION / chars.length;

          let currentContent = '';
          for (const char of chars) {
            currentContent += char;
            setMessagesByAgent(prev => ({
              ...prev,
              [selectedAgentTab]: prev[selectedAgentTab].map(msg =>
                msg.id === messageId
                  ? { ...msg, content: currentContent }
                  : msg
              )
            }));
            await delay(delayPerChar);
          }

          await delay(MESSAGE_DELAY);
        } else {
          // In debug mode, add minimal delay to ensure proper UI updates
          await delay(DELAYS.DEBUG.MESSAGE_DELAY);
        }

        setMessageQueue(prev => prev.slice(1));
        setIsProcessingQueue(false);
      }
    };

    processQueue();
  }, [messageQueue, isProcessingQueue, selectedAgentTab]);

  const addAgentMessage = async (
    message: string, 
    toolType?: 'trial' | 'site' | 'date' | 'button' | 'progresstree',
    options?: { 
      value?: unknown;
      agentPrefix?: string;
      nodeName?: string;
      messageId?: string;  // Optional ID for updating existing messages
    }
  ) => {
    const queueItem = { 
      message, 
      toolType, 
      options,
      messageId: options?.messageId || Date.now().toString()  // Use provided ID or generate new one
    };

    // Check if message with this ID already exists in the queue
    if (options?.messageId) {
      setMessageQueue(prev => {
        const existingIndex = prev.findIndex(item => item.messageId === options.messageId);
        if (existingIndex >= 0) {
          // Update existing message in queue
          const newQueue = [...prev];
          newQueue[existingIndex] = queueItem;
          return newQueue;
        }
        // Add as new message if not found
        return [...prev, queueItem];
      });
    } else {
      // Add new message to queue
      setMessageQueue(prev => [...prev, queueItem]);
    }
  };

  const processAIMessages = async (data: { ai_messages: string }, previousMessages: string, withFindings: boolean = false) => {
    // Handle processing message
    if (data.ai_messages === "Agent is processing!") {
      if (!isMessageProcessed(data.ai_messages, '')) {
        addAgentMessage(data.ai_messages, undefined, { agentPrefix: '', nodeName: '' });
        markMessageAsProcessed(data.ai_messages, '');
      }
      return;
    }

    console.log("Received new messages, current length:", data.ai_messages.length);
    console.log("Previous messages length:", previousMessages.length);

    // Get only the new messages by comparing with previous state
    const newContent = getNewMessages(data.ai_messages, previousMessages);
    
    // If there's no new content, return early
    if (!newContent) {
      console.log("No new content found");
      return;
    }

    console.log("Processing new content, length:", newContent.length);

    // Process the split messages
    const split_delimiters = [
      "================================== Ai Message ==================================", 
      "================================= Tool Message ================================="
    ];
    
    const splitPattern = new RegExp(split_delimiters.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));
    const splittedMessages = newContent.split(splitPattern);

    for (const message of splittedMessages) {
      if (message.length > 0) {
        await delay(1000);
        
        if (message.includes("Name:")) {
          const messageNode = message.split("Name: ")[1];
          const agentNode = messageNode.split(/[:.\r\n]/)[0]?.toLowerCase()??'';
          const agentPrefix = agentNode.split('-')[0]?.trim()??'';
          const nodeName = agentNode.split('-')[1]?.trim()?? '';
          const timestamp = new Date().toISOString();
          
          if (agentPrefix.includes('crm') || agentPrefix.includes('trial') || nodeName.includes('tool')) {
            continue;
          }

          let content = messageNode || '';
          
          if (content.includes("content=")) {
            const parts = content.split("content=");
            if (parts.length > 1) {
              const contentParts = parts[1].split("additional_kwargs=");
              content = contentParts[0] || '';
              content = content.replace(/^['"]|['"]$/g, '');
            }
          }
          
          content = content.replace(/\{[^}]+\}/g, '')
                         .replace(/response_metadata=.*?(?=\n|$)/g, '')
                         .replace(/id='.*?'/g, '')
                         .replace(/usage_metadata=.*?(?=\n|$)/g, '')
                         .replace(/<class '.*?'>/g, '')
                         .trim();
          
          if (agentNode.includes("generate_response_agent") || 
              agentNode.includes("generate_findings_agent")) {
            
            const findingId = `${nodeName}-${content}`.trim();
            if (!isMessageProcessed(findingId, nodeName)) {
              setFindings(prev => ({
                ...prev,
                pd: [...prev.pd, {
                  id: crypto.randomUUID(),
                  agent: nodeName || "findings",
                  content: content.trim(),
                  timestamp
                }]
              }));
              markMessageAsProcessed(findingId, nodeName);
            }
          } else {
            let cleanedContent = content;
            
            if (content.startsWith("trial supervisor - ")) {
              cleanedContent = content.replace("trial supervisor - ", "").trim();
            } else if (content.startsWith("CRM - ")) {
              cleanedContent = content.replace("CRM - ", "").trim();
            }
            
            if (!isMessageProcessed(cleanedContent, nodeName)) {
              addAgentMessage(cleanedContent.trim(), undefined, { agentPrefix, nodeName });
              markMessageAsProcessed(cleanedContent, nodeName);
            }
          }
        } else {
          if (!isMessageProcessed(message, '')) {
            addAgentMessage(message.trim(), undefined, { agentPrefix: '', nodeName: '' });
            markMessageAsProcessed(message, '');
          }
        }
      }
    }

    if (withFindings) {
      await delay(1500);
      
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

      for (const finding of mockFindings.PD) {
        if (!isMessageProcessed(finding.content, finding.agent)) {
          await delay(800);
          setFindings(prev => ({
            ...prev,
            pd: [...prev.pd, finding]
          }));
          markMessageAsProcessed(finding.content, finding.agent);
        }
      }
      
      for (const finding of mockFindings.AE) {
        if (!isMessageProcessed(finding.content, finding.agent)) {
          await delay(800);
          setFindings(prev => ({
            ...prev,
            ae: [...prev.ae, finding]
          }));
          markMessageAsProcessed(finding.content, finding.agent);
        }
      }
    }
  };

  const processProgressTreeResponse = async (response: { data: { activities: TreeNode[] } }, jobId: string) => {
    if (response.data && response.data.activities && response.data.activities.length > 0) {
      // Add the progress tree tool UI
      console.log("Progress tree response:", response.data.activities)
      addAgentMessage(
        "",  // Empty message since we're just showing the tree
        "progresstree",
        {
          messageId: `progress-tree-${jobId}`,  // Use jobId to make unique identifier
          value: response.data.activities,  // Taking the first tree node as our root
          onChange: (updatedTree: TreeNode) => {
            setProgressTree(updatedTree);
          },
          progressTreeProps: {
            showBreadcrumbs: true,
            showMiniMap: true,
            showKeyboardNav: true,
            showQuickActions: true,
            initialExpandedNodes: ['0', '0.0'],  // Expand first two levels by default
            animationDuration: 200
          }
        }
      );
    }
  };

  const fetchAIMessages = async (jobId: string, withFindings: boolean = false) => {
    try {
      if (!jobId) return;

      // First, get the current job status
      const jobResponse = await auditService.getJobDetails(jobId);
      const jobData = jobResponse.data;
      
      // Update job status
      setJobStatus(jobData.status);

      if (jobData.status === "completed" || jobData.status === "running") {
        // Fetch AI messages and progress tree
        /*
        const [messagesResponse, progressTreeResponse] = await Promise.all([
          auditService.getAIMessages(jobId, withFindings),
          auditService.getAgentProgress(jobId)
        ]);
        */
        const [progressTreeResponse] = await Promise.all([
          auditService.getAgentProgress(jobId)
        ]);
        
       /*
        // Process the messages and update state
        await Promise.all([
          // processAIMessages(messagesResponse.data, previousAIMessagesRef.current, withFindings),
          processProgressTreeResponse(progressTreeResponse, jobId)
        ]);
        */
        await Promise.all([
          // processAIMessages(messagesResponse.data, previousAIMessagesRef.current, withFindings),
          processProgressTreeResponse(progressTreeResponse, jobId)
        ]);
        
        // Update previous messages for next comparison
        // previousAIMessagesRef.current = messagesResponse.data.ai_messages;
      }
    } catch (error) {
      console.error("Error fetching AI messages:", error);
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
      }, 400000); 
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);

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
      
      // Add AI response to queue
      setMessageQueue(prev => [...prev, { 
        message: randomResponse,
        options: { nodeName: agent }
      }]);
    }, 1000);
  };

  const updateUserInput = (agent: AgentType, value: string) => {
    setUserInput(prev => ({
      ...prev,
      [agent]: value
    }));
  };

  const getCurrentFindings = () => {
    // Ensure findings is properly initialized
    if (!findings) return [];
    
    // Combine all findings into a single array
    const allFindings = [
      ...(Array.isArray(findings.pd) ? findings.pd : []),
      ...(Array.isArray(findings.ae) ? findings.ae : []),
      ...(Array.isArray(findings.sgr) ? findings.sgr : [])
    ];
    
    return allFindings;
  };

  const scheduleAnalysisJob = async () => {
    try {
      const formattedDateRange = `${dateRange.from.toISOString().split('T')[0]} - ${dateRange.to.toISOString().split('T')[0]}`;
      
      const response = await auditService.scheduleJob(
        selectedSite,
        selectedTrial,
        formattedDateRange
      );
      
      const { job_id } = response.data;
      setJobId(job_id);
      setJobStatus('queued');
      
      addAgentMessage(`I've scheduled the Job for analysis! Job ID: ${job_id}`, undefined, { agentPrefix: '', nodeName: '' });
      
      return job_id;
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
      setIsProcessing(false);
    } catch (error) {
      console.error('Error running analysis:', error);
      setIsProcessing(false);
    }
  };

  const handleToolInput = (type: 'trial' | 'site' | 'date' | 'button' | 'progresstree', value: any) => {
    console.log('Tool Input:', { type, value });
    if (type === 'progresstree') {
      setSelectedTreeNode(value);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-6">
        <div className="mb-4">
          <img src="/icons/icon.png" alt="App Icon" className="w-10 h-10" />
        </div>
        <div className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <Home className="w-6 h-6 text-gray-600" />
        </div>
        <div className="p-2 bg-blue-50 rounded-lg cursor-pointer">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <AlertCircle className="w-6 h-6 text-gray-600" />
        </div>
        <div className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <Settings className="w-6 h-6 text-gray-600" />
        </div>
        <div className="mt-auto p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <HelpCircle className="w-6 h-6 text-gray-600" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Menu className="w-6 h-6 text-gray-600 lg:hidden" />
              <h1 className="text-xl font-semibold text-gray-800"> Audit Copilot</h1>
            </div>
            {/* <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3">
                {['trial_master', 'inspection_master', 'crm_master'].map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setSelectedAgentTab(agent as AgentType)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedAgentTab === agent
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {agent.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                onToolInput={handleToolInput}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <FindingsTable 
                findings={getCurrentFindings()}
                selectedTreeNode={selectedTreeNode}
                selectedFindingTab={selectedFindingTab}
                setSelectedFindingTab={setSelectedFindingTab}
                expandedRows={expandedRows}
                setExpandedRows={setExpandedRows}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div> 2025 Clinical Trial Audit Assistant</div>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
              <a href="#" className="hover:text-gray-900">Contact Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
