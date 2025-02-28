import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AgentWindow } from '../components/AgentWindow';
import { SearchForm } from '../components/SearchForm';
import { FindingsTable } from '../components/FindingsTable';
import { FindingsSummary } from '../components/findings/FindingsSummary';
import { mockResponses, pdFindings, aeFindings, sgrFindings, trials, sites } from '../data/mockData';
import { Finding, Message, AgentType } from '../types';
import { Home, FileText, AlertCircle, Settings, HelpCircle, Menu } from 'lucide-react';
import { auditService } from '../api/services/auditService'; // Import the audit service
import { AIMessagesResponse, TreeNode } from '../api';

// Set this to true to skip message streaming animation (for debugging)
const SKIP_ANIMATION = true;

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
  const currentActivitiesRef = useRef<TreeNode[]>([]);
  const allActivitiesRef = useRef<TreeNode[]>([]);
  const lastJobStatusRef = useRef<string | null>(null);
  const lastAIMessagePositionRef = useRef<number>(0);
  const awaitingForFeedbackRef = useRef<boolean>(false);
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
  const [findings, setFindings] = useState<unknown>();

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
    messageId?: string;
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
            id: messageId || options?.messageId || Date.now().toString(),
            agent: 'trial_master_agent',
            content: JSON.stringify({
              type: 'tool_ui',
              tool: {
                type: toolType,
                message,
                options: options || (toolType === 'button' ? { buttonText: 'Begin Compliance Review' } : undefined),
              },
            }),
            timestamp: new Date(),
            isUser: false,
            nodeName: options?.nodeName || '',
            toolType: toolType, // Add the toolType property here
          };

          const cont = JSON.stringify({
            type: 'tool_ui',
            tool: {
              type: toolType,
              message,
              options: options || (toolType === 'button' ? { buttonText: 'Begin Compliance Review' } : undefined),
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
          id: messageId || options?.messageId || Date.now().toString(),
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

  function generateTimeBasedUUID() {
    return 'uuid-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

  const processAIMessages = async (data: { ai_messages: string }, previousMessages: string, withFindings: boolean = false) => {
    try {
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

      // Process messages in sequence
      for (const message of splittedMessages) {
        if (!message.trim()) continue;

        try {
          await delay(1000);

          if (message.includes("Name:")) {
            const messageNode = message.split("Name: ")[1];
            if (!messageNode) continue;

            const agentNode = messageNode.split(/[:.\r\n]/)[0]?.toLowerCase() ?? '';
            const agentPrefix = agentNode.split('-')[0]?.trim() ?? '';
            const nodeName = agentNode.split('-')[1]?.trim() ?? '';
            const timestamp = new Date().toISOString();

            // Skip certain agent types
            if (agentPrefix.includes('crm') || agentPrefix.includes('trial') || nodeName.includes('tool')) {
              continue;
            }

            let content = messageNode || '';

            // Extract content from message
            if (content.includes("content=")) {
              const parts = content.split("content=");
              if (parts.length > 1) {
                const contentParts = parts[1].split("additional_kwargs=");
                content = contentParts[0] || '';
                content = content.replace(/^['"]|['"]$/g, '');
              }
            }

            // Clean up content
            content = content.replace(/\{[^}]+\}/g, '')
              .replace(/response_metadata=.*?(?=\n|$)/g, '')
              .replace(/id='.*?'/g, '')
              .replace(/usage_metadata=.*?(?=\n|$)/g, '')
              .replace(/<class '.*?'>/g, '')
              .trim();

            // Handle different agent types
            if (agentNode.includes("generate_response_agent") ||
              agentNode.includes("generate_findings_agent")) {

              const findingId = `${nodeName}-${content}`.trim();
              if (!isMessageProcessed(findingId, nodeName)) {
                setFindings(prev => ({
                  ...prev,
                  pd: [...prev.pd, {
                    id: generateTimeBasedUUID(),
                    agent: nodeName || "findings",
                    content: content.trim(),
                    timestamp
                  }]
                }));
                markMessageAsProcessed(findingId, nodeName);
              }
            } else {
              let cleanedContent = content;

              // Clean up agent-specific prefixes
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
            // Handle messages without "Name:" prefix
            if (!isMessageProcessed(message, '')) {
              const cleanedMessage = message.trim();
              if (cleanedMessage) {
                addAgentMessage(cleanedMessage, undefined, { agentPrefix: '', nodeName: '' });
                markMessageAsProcessed(cleanedMessage, '');
              }
            }
          }
        } catch (error) {
          console.error("Error processing message:", error);
          // Continue processing other messages even if one fails
          continue;
        }
      }

      // Handle findings if requested
      if (withFindings) {
        await delay(1500);

        const timestamp = new Date().toISOString();
        const mockFindings = {
          PD: [
            {
              id: generateTimeBasedUUID(),
              agent: "inspection",
              content: "Protocol Deviation Finding: All identified protocol deviations were resolved within acceptable timeframes (2-4 weeks). Effective measures included enhanced training and re-consent procedures.",
              timestamp
            }
          ],
          AE: [
            {
              id: generateTimeBasedUUID(),
              agent: "inspection",
              content: "Adverse Events Finding: All AEs/SAEs have been properly documented with final dispositions and end dates in RAVE.",
              timestamp
            }
          ],
          SGR: []
        };

        // Process PD findings
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

        // Process AE findings
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
    } catch (error) {
      console.error("Error in processAIMessages:", error);
      addAgentMessage("An error occurred while processing messages. Some messages may be missing.", undefined, { agentPrefix: '', nodeName: '' });
    }
  };

  const findAndRemoveUnknownNode = (activities: TreeNode[]): { updatedActivities: TreeNode[], humanFeedbackPrompt: string | undefined } => {
    if (!activities || activities.length === 0) {
      return { updatedActivities: [], humanFeedbackPrompt: undefined };
    }

    // Get the last activity
    const lastActivity = activities[activities.length - 1];

    // Helper function to find the last leaf node
    const findLastLeafNode = (node: TreeNode): { node: TreeNode | null, parent: TreeNode | null } => {
      if (!node.children || node.children.length === 0) {
        return { node, parent: null };
      }

      const lastChild = node.children[node.children.length - 1];
      const result = findLastLeafNode(lastChild);
      if (result.node === lastChild) {
        result.parent = node;
      }
      return result;
    };

    // Find the last leaf node in the last activity
    const { node: lastLeaf, parent } = findLastLeafNode(lastActivity);

    // If the last leaf has name "unknown", remove it and return its content
    if (lastLeaf && lastLeaf.name === "Unknown" && !lastLeaf.content?.includes("User input -> Human Feedback:")) {
      const humanFeedbackPrompt = lastLeaf.content;
      
      // Remove the unknown node from its parent
      if (parent && parent.children) {
        parent.children = parent.children.slice(0, -1);
        // If parent now has no children, remove it from activities
        if (parent.children.length === 0 && activities.length > 1) {
          activities = activities.slice(0, -1);
        }
      } else {
        // If the unknown node is at the root level, remove the entire activity
        activities = activities.slice(0, -1);
      }

      return {
        updatedActivities: activities,
        humanFeedbackPrompt
      };
    }

    return {
      updatedActivities: activities,
      humanFeedbackPrompt: undefined
    };
  };

  const buildTreeFromFilteredData = (filteredActivities: TreeNode[] | undefined) => {
    if (!filteredActivities || filteredActivities.length === 0) return allActivitiesRef.current;

    const activities = [...allActivitiesRef.current];
    const parentNodes = ["inspection - site_area_agent", "trial supervisor - inspection_master_agent"];
    
    filteredActivities.forEach((activity) => {
      if (parentNodes.includes(activity.name)) {
        // If it's a parent node, add it directly to activities
        activities.push(deepCloneTreeNode(activity));
      } else {
        // If it's a child node, add it to the last parent's children
        const lastParentNode = activities[activities.length - 1];
        if (lastParentNode) {
          if (!lastParentNode.children) {
            lastParentNode.children = [];
          }
          lastParentNode.children.push(deepCloneTreeNode(activity));
        } else {
          // If no parent exists, add directly to activities
          activities.push(deepCloneTreeNode(activity));
        }
      }
    });

    return activities;
  };

  const deepCloneTreeNode = (node: TreeNode): TreeNode => {
    const clonedNode: TreeNode = {
      ...node,
      children: node.children ? node.children.map(child => deepCloneTreeNode(child)) : undefined
    };
    return clonedNode;
  };

  const buildTreeFromFilteredDataWithoutPreviousTree = (filteredActivities: TreeNode[] | undefined) => {
    if (!filteredActivities || filteredActivities.length === 0) return [];
    const parentNodes = ["inspection - site_area_agent", "trial supervisor - inspection_master_agent"];
    const previousActivities = currentActivitiesRef.current
    const activities: TreeNode[] = []
    const firstNewNode = filteredActivities[0]
    if (previousActivities && previousActivities.length > 0 && !parentNodes.includes(firstNewNode.name)) {
      const lastParentNode = previousActivities[previousActivities.length - 1]
      const parentNode: TreeNode = {
        id: lastParentNode.id,
        name: lastParentNode.name,
        children: []
      }
      activities.push(parentNode)
    }
    
    
    // Find the last Unknown activity if it exists
    // const lastUnknownActivity = [...filteredActivities].reverse().find(activity => activity.name === "Unknown");
    
    filteredActivities.forEach((activity) => {
      // Skip Unknown activities except for the last one
      // if (activity.name === "Unknown" && activity !== lastUnknownActivity) {
      //   return;
      // }
      
      if (parentNodes.includes(activity.name)) {
        // If it's a parent node, deep clone and add it
        activities.push(deepCloneTreeNode(activity));
      } else {
        // If it's a child node, add it to the last parent's children
        const lastParentNode = activities[activities.length - 1];
        if (lastParentNode) {
          if (!lastParentNode.children) {
            lastParentNode.children = [];
          }
          // Deep clone the child before adding
          lastParentNode.children.push(deepCloneTreeNode(activity));
        } else {
          // If no parent exists, deep clone and add directly to activities
          activities.push(deepCloneTreeNode(activity));
        }
      }
    });

    return activities;
  };

  const processProgressTreeResponse = async (aiMessageResponse: AIMessagesResponse, jobId: string) => {
    console.log("BackendIntegration: ", "processProgressTreeResponse  : ", aiMessageResponse)
    console.log("processProgressTreeResponse:", aiMessageResponse);
    let filteredActivities = aiMessageResponse.filtered_data
    filteredActivities = filteredActivities?.filter(node => !(node.name === "Unknown" && node.content?.includes("User input -> Human Feedback:")))
    if(!filteredActivities || filteredActivities.length == 0) return
    const activities = buildTreeFromFilteredDataWithoutPreviousTree(filteredActivities)
    allActivitiesRef.current = buildTreeFromFilteredData(filteredActivities);
    // Update the ref with new activities
    // currentActivitiesRef.current = buildTreeFromFilteredData(filteredActivities);
    currentActivitiesRef.current = activities;
    console.log("Activities length: ", activities?.length, " new activites : ", filteredActivities, " after building tree activities: ", activities);
    if (activities && activities?.length > 0) {
      // Process the activities to handle unknown node
      const { updatedActivities, humanFeedbackPrompt } = findAndRemoveUnknownNode(activities);
      console.log("humanFeedbackPrompt:", humanFeedbackPrompt);
      // If we have regular activities, add them as a progress tree
      if (updatedActivities.length > 0) {
        console.log("Progress tree response:", updatedActivities);
        addAgentMessage(
          "",  // Empty message since we're just showing the tree
          "progresstree",
          {
            // messageId: `progress-tree-${jobId}`,  // Use jobId to make unique identifier
            value: updatedActivities,
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

      // If we found an unknown node, add its content as a regular message after a delay
      if (humanFeedbackPrompt && !awaitingForFeedbackRef.current) {
        console.log("Human feedback prompt:", humanFeedbackPrompt)
        awaitingForFeedbackRef.current = true;
        setTimeout(() => {
          addAgentMessage(humanFeedbackPrompt);
        }, 10000); // 10 seconds delay
      }
    }
  };

  const fetchAIMessages = async (jobId: string, withFindings: boolean = false, retryCount: number = 3) => {
    try {
      if (!jobId || jobStatus === "completed" || jobStatus === "error") return;
      if(awaitingForFeedbackRef.current) return;
      console.log("BackendIntegration", "fetchAIMessages...");

      // First, get the current job status
      const jobDetailsResponse = await auditService.getJobDetails(jobId);
      const jobData = jobDetailsResponse.data;
      console.log("BackendIntegration", "fetchAIMessages: jobData: ", jobData, ", lastJobStatusRef: ", lastJobStatusRef.current);

      if (!jobData) {
        throw new Error("Failed to fetch job details");
      }

      setJobStatus(jobData.status);
      

      // Check if status is not completed/error OR if it's first fetch OR if status has changed from last check
      if ((jobData.status !== "completed" && jobData.status !== "error")) {
        withFindings = true;
        if(!isProcessing && !awaitingForFeedbackRef.current)
        setIsProcessing(true);
        try {
          const progressTreeResponse = await auditService.getAIMessages(jobId, true, lastAIMessagePositionRef.current);
          console.log("BackendIntegration: ", "fetchAIMessages completed : ", progressTreeResponse);

          if (!progressTreeResponse.data) {
            throw new Error("Failed to fetch AI messages");
          }

          if (progressTreeResponse.data && progressTreeResponse.data.findings) {
            setFindings(progressTreeResponse.data);
          }

          // Update last message position if available
          if (progressTreeResponse.data.last_position !== undefined) {
            lastAIMessagePositionRef.current = progressTreeResponse.data.last_position;
          }

          // Process the response
          await processProgressTreeResponse(progressTreeResponse.data, jobId);

          // Update last status
          lastJobStatusRef.current = jobData.status;
        } catch (error) {
          console.error("Error fetching AI messages:", error);
          
          // Retry logic for AI messages fetch
          if (retryCount > 0) {
            console.log(`Retrying AI messages fetch. Attempts remaining: ${retryCount - 1}`);
            await delay(2000); // Wait 2 seconds before retry
            return fetchAIMessages(jobId, withFindings, retryCount - 1);
          } else {
            addAgentMessage("Failed to fetch AI messages after multiple attempts. Please try again later.", undefined, { agentPrefix: '', nodeName: '' });
          }
        }
      } else {
        setIsProcessing(false);
      }
      console.log("BackendIntegration", "fetchAIMessages: before job (jobData.status === completed) ", jobData.status)
      // If job is completed and withFindings is true, fetch findings
      if (jobData.status === "completed") {
        setJobStatus(jobData.status)
        lastJobStatusRef.current = jobData.status;
        try {
          const findingsResponse = await auditService.getAIMessages(jobId, true, lastAIMessagePositionRef.current);
          if (findingsResponse.data && findingsResponse.data.findings) {
            setFindings(findingsResponse.data);
          }
          addAgentMessage("Compliance checking is completed successfully. Please review the finding generated.")
          if(allActivitiesRef.current && allActivitiesRef.current.length > 0) {
            console.log("Final summary of All Agents activities : ", allActivitiesRef.current);
            await delay(2000);
            addAgentMessage(
              "",  // Empty message since we're just showing the tree
              "progresstree",
              {
                // messageId: `progress-tree-${jobId}`,  // Use jobId to make unique identifier
                value: allActivitiesRef.current,
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
          
        } catch (error) {
          console.error("Error fetching findings:", error);
          addAgentMessage("Failed to fetch findings. Please try refreshing the page.", undefined, { agentPrefix: '', nodeName: '' });
        }
      }
      lastJobStatusRef.current = jobData.status;
    } catch (error) {
      
      console.error("BackendIntegration: ", "Error in fetchAIMessages:", error);
      
      // Retry logic for job details fetch
      if (retryCount > 0) {
        console.log(`Retrying job details fetch. Attempts remaining: ${retryCount - 1}`);
        await delay(2000); // Wait 2 seconds before retry
        return fetchAIMessages(jobId, withFindings, retryCount - 1);
      } else {
        lastJobStatusRef.current = "error";
        addAgentMessage("Failed to fetch job details after multiple attempts. Please try again later.", undefined, { agentPrefix: '', nodeName: '' });
      }
    }
  };

  const checkJobStatus = async (jobId: string) => {
   
   return jobStatus
  };

  useEffect(() => {
    console.log("Effect triggered - jobId:", jobId, "isProcessing:", isProcessing);
    
    if (!jobId) return;

    const pollJobStatus = async () => {
      try {
        console.log("Polling job status for jobId:", jobId);
        const status = lastJobStatusRef.current
        console.log("Received job status:", status);
        
        if (status === 'completed' || status === 'error') {
          if (status === 'completed') {
            console.log("Job completed, fetching final messages");
            await fetchAIMessages(jobId, true);
            // addAgentMessage(`Compliance Review Process completed.`);
            clearTimeout(timeoutId);
          } else {
            console.log("Job error, stopping process");
            addAgentMessage(`Compliance Review Process Halted: ${status}. Please review and try again.`, undefined, { agentPrefix: '', nodeName: '' });
            setIsProcessing(false);
          }
          return;
        }

        if (!awaitingForFeedbackRef.current) {
          console.log("Fetching messages during polling");
          await fetchAIMessages(jobId, false);
        } else {
          console.log("Skipping message fetch - awaiting feedback");
        }
      } catch (error) {
        console.error('Error in polling cycle:', error);
      }
    };

    let timeoutId: NodeJS.Timeout;
    
    const startPolling = async () => {
      await pollJobStatus();
      const status = lastJobStatusRef.current
      if(status !== "completed" && status !== "error") {
        timeoutId = setTimeout(startPolling, 8000);
      }
      
    };

    // Start the polling
    startPolling();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [jobId]);

  const handleSendMessage = (agent: AgentType, e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput[agent].trim()) return;

    const newMessage: Message = {
      id: generateTimeBasedUUID(),
      agent,
      content: userInput[agent],
      timestamp: new Date(),
      isUser: true
    };

    // Add message to conversation
    setMessagesByAgent(prev => ({
      ...prev,
      [agent]: [...prev[agent], newMessage]
    }));

    // Clear input
    setUserInput(prev => ({
      ...prev,
      [agent]: ''
    }));

    // Check if we're awaiting feedback
    if (awaitingForFeedbackRef.current) {
      try {
        auditService.updateJobFeedback(jobId!, userInput[agent]).then(() => {
          
          addAgentMessage("Thanks for your input. I'm processing your feedback now...")
          setIsProcessing(true);
          awaitingForFeedbackRef.current = false; // Reset the feedback state
          
          delay(5000).then(() => {
            auditService.getJobDetails(jobId!).then((res) => {
              if(res.data.status === "got_human_feedback") {
                // setMessagesByAgent(prev => {
                //   const messages = prev[agent];
                //   console.log("Current messages:", messages.map(m => ({ id: m.id, toolType: m.toolType })));
                //   // Find the last index of a message with toolType = 'progresstree'
                //   const lastProgressTreeIndex = messages.map(m => m?.toolType === 'progresstree').lastIndexOf(true);
                //   console.log("lastProgressTreeIndex:", lastProgressTreeIndex)
                //   return {
                //     ...prev,
                //     [agent]: lastProgressTreeIndex >= 0 ? messages.slice(0, lastProgressTreeIndex + 1) : messages
                //   }
                // });
                
                fetchAIMessages(jobId!, true);
              }
            })
            
          })
        });
        
      } catch (error) {
        console.error('Error updating job feedback:', error);
      }
      return;
    }
    
    // Regular message flow
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
      // setJobStatus('queued');
      
      addAgentMessage(`Compliance Review Process Initiated - Job ID: ${job_id}`, undefined, { agentPrefix: '', nodeName: '' });
      setIsProcessing(true);
      
      return job_id;
    } catch (error) {
      console.error('Error initiating compliance review:', error);
      
      addAgentMessage(`Unable to initiate compliance review: ${error instanceof Error ? error.message : 'An unexpected issue occurred'}`, undefined, { agentPrefix: '', nodeName: '' });
      
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
              <h1 className="text-xl font-semibold text-gray-800"> Audit Compliance Assistant</h1>
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
                handleSendMessage={(e) =>  handleSendMessage(selectedAgentTab, e)}
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
                isThinking={isProcessing && !awaitingForFeedbackRef.current}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col flex-1">
                <div className="flex flex-col space-y-4 p-4">
                  <FindingsTable 
                    findings={findings}
                    selectedTreeNode={selectedTreeNode}
                    selectedFindingTab={selectedFindingTab}
                    setSelectedFindingTab={setSelectedFindingTab}
                    expandedRows={expandedRows}
                    setExpandedRows={setExpandedRows}
                  />
                </div>
              </div>
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
