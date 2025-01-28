import React, { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ToolUI } from './ToolUI';
import { MessageInput } from './agent/MessageInput';
import { MessageBubble } from './agent/MessageBubble';
import { getMessageBackgroundColor } from './agent/utils';
import { AuditProgressSteps } from './agent/AuditProgressSteps';
import { AgentWindowProps } from './agent/types';

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

  const handleScroll = () => {
    setShouldAutoScroll(isScrolledToBottom());
  };

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (!dateButtonRef.current || !dateButtonRef.current.contains(event.target as Node)) &&
        (!datePickerRef.current || !datePickerRef.current.contains(event.target as Node))
      ) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToolInput = (type: 'trial' | 'site' | 'date' | 'button', value: any) => {
    switch (type) {
      case 'button':
        if (currentStep === 'greeting') {
          setShowGreeting(false);
          setCurrentStep('trial');
          addAgentMessage('Please select the Trial ID from the options below', 'trial');
        } else if (currentStep === 'confirm' && !isAnalysisStarted) {
          setIsAnalysisStarted(true);
          handleRunClick();
        }
        break;
      case 'trial':
        setSelectedTrial(value);
        setCurrentStep('site');
        addAgentMessage('Please select the Site ID', 'site');
        break;
      case 'site':
        setSelectedSite(value);
        setCurrentStep('date');
        addAgentMessage('Please select the date range', 'date');
        break;
      case 'date':
        setDateRange(value);
        if (value.from && value.to) {
          setCurrentStep('confirm');
          addAgentMessage(
            `Please confirm to proceed Analysis with Trial ID: ${selectedTrial}, Site ID: ${selectedSite}, Date: ${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`,
            'button'
          );
          onInputComplete({
            selectedTrial,
            selectedSite,
            dateRange: value,
          });
        }
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-10 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold mb-6">Audit Agent</h2>
        <AuditProgressSteps currentStep={currentStep} />
      </div>

      <div ref={messageContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {(!messages || messages.length === 0) && showGreeting && (
            <div className="flex items-start space-x-2">
              <Avatar className="h-8 w-8 bg-gray-100">
                <AvatarFallback className="text-gray-700">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900">
                <p className="text-sm mb-2">Greetings! Would you like to start a Trial Analysis?</p>
                <ToolUI
                  type="button"
                  value={false}
                  onChange={() => handleToolInput('button', true)}
                  options={{
                    buttonText: 'Yes, Proceed',
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <MessageInput
          userInput={userInput}
          updateUserInput={updateUserInput}
          handleSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};