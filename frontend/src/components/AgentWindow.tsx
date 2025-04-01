import React, { useEffect, useRef, useState, useCallback } from 'react';
import { User, Bot, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ToolUI } from './ToolUI';
import { MessageInput } from './agent/MessageInput';
import { MessageBubble } from './agent/MessageBubble';
import { getMessageBackgroundColor } from './agent/utils';
import { AuditProgressSteps } from './agent/AuditProgressSteps';

// Define trial to site ID mapping 
const TRIAL_SITE_MAPPING: Record<string, string[]> = {
  CNTO1275PUC3001: ["P73-PL10007", "P73-PL10008"],
  RIVAROXHFA3001: ["AR00091"],
  "90014496LYM1001": ["BV7-US10007"],
};

interface AgentWindowProps {
  trials: string[];
  sites: { [key: string]: Array<{ id: string; status: string }> };
  onInputComplete: (data: { selectedTrial: string; selectedSite: string; dateRange: { from: Date; to: Date } }) => void;
  handleRunClick: () => void;
  addAgentMessage: (message: string, type?: string, options?: { messageId: string }) => void;
  onToolInput?: (type: 'trial' | 'site' | 'date' | 'button' | 'progresstree', value: any) => void;
  messages: any[];
  userInput: string;
  updateUserInput: (value: string) => void;
  handleSendMessage: () => void;
  isThinking?: boolean;
}

export const AgentWindow: React.FC<AgentWindowProps> = ({
  messages,
  userInput,
  updateUserInput,
  handleSendMessage,
  trials,
  sites,
  onInputComplete,
  handleRunClick,
  addAgentMessage,
  onToolInput,
  isThinking = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const [selectedTrial, setSelectedTrial] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'trial' | 'site' | 'date' | 'confirm'>('greeting');
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false);
  const [useRandomSiteId] = useState<boolean>(true); // Set to false to use manual site selection

  const isScrolledToBottom = () => {
    const container = messageContainerRef.current;
    if (!container) return true;
    
    const threshold = 50; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  };

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = useCallback(() => {
    setShouldAutoScroll(isScrolledToBottom());
  }, []);

  useEffect(() => {
    console.log("AgentWindow messages", messages);
  }, [messages]);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages, shouldAutoScroll]);

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Add this state at the top with other useState declarations
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }
    scrollToBottom();
  }, [messages, shouldAutoScroll, isFirstLoad]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close if the click is on the date picker button
      if (dateButtonRef.current?.contains(event.target as Node)) {
        return;
      }
      
      // Don't close if the click is inside the date picker
      if (datePickerRef.current?.contains(event.target as Node)) {
        return;
      }
      
      // Don't close if clicking on month navigation buttons or day cells
      const target = event.target as HTMLElement;
      if (
        target.closest('.rdp-nav_button') || 
        target.closest('.rdp-button') ||
        target.closest('.rdp-day') ||
        target.closest('.rdp-head_cell')
      ) {
        return;
      }
      
      // If we get here, the click was outside, so close the date picker
      setShowDatePicker(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Effect to update site ID when trial ID changes - this must run whenever selectedTrial changes
    if (selectedTrial && useRandomSiteId) {
      // Get site IDs for the selected trial
      const specificSiteIDs = TRIAL_SITE_MAPPING[selectedTrial] || [];
      
      if (specificSiteIDs.length > 0) {
        // Select a random site from the predefined list for this trial
        const randomIndex = Math.floor(Math.random() * specificSiteIDs.length);
        const randomSite = specificSiteIDs[randomIndex];
        setSelectedSite(randomSite);
      } else if (sites[selectedTrial]?.length > 0) {
        // Fallback to using the sites from the prop if no predefined mapping exists
        const randomIndex = Math.floor(Math.random() * sites[selectedTrial].length);
        const randomSite = sites[selectedTrial][randomIndex].id;
        setSelectedSite(randomSite);
      }
    }
  }, [selectedTrial, useRandomSiteId, sites]);

  useEffect(() => {
    // Separate effect to update the confirmation message when any parameter changes
    if (currentStep === 'confirm') {
      updateConfirmationMessage();
    }
  }, [selectedTrial, selectedSite, dateRange, currentStep]);

  const updateConfirmationMessage = () => {
    const confirmationMessageId = 'confirmation-summary';
    
    // Construct message based on available data
    let message = `📋 Compliance Preparedness Assessment Parameters:\n\n`;
    
    if (selectedTrial) {
      message += `🔹 Trial ID:    ${selectedTrial}\n`;
    }
    
    if (dateRange.from && dateRange.to) {
      message += `🔹 Review Period:     ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}\n\n`;
    }
    
    message += `Please confirm to initiate the compliance preparedness review.`;
    
    addAgentMessage(message, 'button', { messageId: confirmationMessageId });
    
    // Only update parent if we have complete data
    if (selectedTrial && dateRange.from && dateRange.to) {
      onInputComplete({
        selectedTrial,
        selectedSite,
        dateRange: {
          from: dateRange.from,
          to: dateRange.to
        },
      });
    }
  };

  const handleToolInput = (type: 'trial' | 'site' | 'date' | 'button' | 'progresstree', value: any) => {
    // Handle internal state updates for wizard flow
    switch (type) {
      case 'button':
        if (currentStep === 'greeting') {
          setCurrentStep('trial');
          const trialCount = trials?.length || 0;
          const trialText = trialCount === 1 ? 'trial' : 'trials';
          addAgentMessage(
            `I've identified ${trialCount} active ${trialText} in the system. Which one would you like to analyze?`, 
            'trial',
            { messageId: 'trial-selection-message' }
          );
        } else if (currentStep === 'confirm' && !isAnalysisStarted) {
          setIsAnalysisStarted(true);
          handleRunClick();
        }
        break;
      case 'trial':
        setSelectedTrial(value);
        
        // If we're already at the confirmation step, stay there and update the message
        if (currentStep === 'confirm') {
          // The useEffect will handle updating the message
          break;
        }
        
        // Otherwise, proceed with normal trial selection flow
        // Get the available sites for the selected trial
        const sitesForTrial = sites[value] || [];
        
        if (useRandomSiteId) {
          // RANDOM SITE ID SELECTION MODE
          // Get site IDs for the selected trial, or fall back to available sites
          const specificSiteIDs = TRIAL_SITE_MAPPING[value] || [];
          
          if (specificSiteIDs.length > 0) {
            // Select a random site from the predefined list for this trial
            const randomIndex = Math.floor(Math.random() * specificSiteIDs.length);
            const randomSite = specificSiteIDs[randomIndex];
            setSelectedSite(randomSite);
            
            // Skip directly to date selection
            setCurrentStep('date');
            addAgentMessage(
              `Please specify the audit review period for the compliance preparedness assessment:`, 
              'date',
              { messageId: 'date-selection-message' }
            );
          } else if (sitesForTrial.length > 0) {
            // Fallback to using the sites from the prop if no predefined mapping exists
            const randomIndex = Math.floor(Math.random() * sitesForTrial.length);
            const randomSite = sitesForTrial[randomIndex].id;
            setSelectedSite(randomSite);
            
            // Skip directly to date selection
            setCurrentStep('date');
            addAgentMessage(
              `Please specify the audit review period for the compliance preparedness assessment:`, 
              'date',
              { messageId: 'date-selection-message' }
            );
          } else {
            // Handle the case where there are no sites for the selected trial
            addAgentMessage(
              `I couldn't find any clinical sites associated with this trial. Please select a different trial.`,
              'trial',
              { messageId: 'trial-selection-message' }
            );
          }
        } else {
          // MANUAL SITE ID SELECTION MODE
          setCurrentStep('site');
          const siteCount = sitesForTrial.length;
          addAgentMessage(
            siteCount === 1
              ? `I've located 1 clinical site associated with this trial. Would you like to review it?`
              : `I've located ${siteCount} clinical sites associated with this trial. Which site would you like to review?`,
            'site',
            { messageId: 'site-selection-message' }
          );
        }
        
        break;
      case 'site':
        setSelectedSite(value);
        setCurrentStep('date');
        addAgentMessage(
          `Please specify the audit review period for the compliance preparedness assessment:`, 
          'date',
          { messageId: 'date-selection-message' }
        );
        break;
      case 'date':
        setDateRange(value);
        if (value.from && value.to) {
          setCurrentStep('confirm');
          // The confirmation message will be created/updated by the useEffect
        }
        break;
    }
    // Pass all tool inputs to parent component
    if (onToolInput) {
      onToolInput(type, value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center p-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-gray-800" />
          Agent Window
        </h2>
      </div>

      <div ref={messageContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {(!messages || messages.length === 0) && showGreeting && (
            <div className="flex items-start space-x-2">
              <Avatar className="h-8 w-8 bg-emerald-100 border border-emerald-200 shadow-sm">
                <AvatarFallback className="text-emerald-700">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900">
                <p className="text-sm mb-2">Would you like to initiate a compliance check?</p>
                <ToolUI
                  type="button"
                  value={false}
                  onChange={() => handleToolInput('button', true)}
                  options={{
                    buttonText: 'Begin Compliance Review',
                  }}
                />
              </div>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              selectedTrial={selectedTrial}
              selectedSite={selectedSite}
              dateRange={dateRange}
              handleToolInput={handleToolInput}
              trials={trials}
              sites={sites}
              datePickerRef={datePickerRef}
              dateButtonRef={dateButtonRef}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              isAnalysisStarted={isAnalysisStarted}
            />
          ))}
          {isThinking && (
            <div className="flex items-start space-x-2">
              <Avatar className="h-8 w-8 bg-emerald-100 border border-emerald-200">
                <AvatarFallback className="text-emerald-700">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <MessageInput
          userInput={userInput}
          updateUserInput={updateUserInput}
          handleSendMessage={handleSendMessage}
          disabled={isThinking}
        />
      </div>
    </div>
  );
};