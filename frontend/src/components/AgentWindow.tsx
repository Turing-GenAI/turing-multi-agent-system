import React, { useEffect, useRef, useState } from 'react';
import { Send, User, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Message } from '../types';
import { ProgressSteps, Step } from './ProgressSteps';
import { ToolUI } from './ToolUI';
import { getAgentDisplayName } from '../data/agentNames';

interface ToolMessage {
  type: 'progress_steps' | 'tool_ui';
  steps?: Step[];
  tool?: {
    type: 'trial' | 'site' | 'date' | 'button';
    message: string;
    options?: {
      buttonText?: string;
    };
  };
}

interface AgentWindowProps {
  messages: Message[];
  userInput: string;
  updateUserInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  trials: string[];
  sites: {
    [key: string]: Array<{ id: string; status: string }>;
  };
  onInputComplete: (data: {
    selectedTrial: string;
    selectedSite: string;
    dateRange: { from: Date | undefined; to: Date | undefined };
  }) => void;
  handleRunClick: () => void;
  addAgentMessage: (message: string, toolType?: 'trial' | 'site' | 'date' | 'button') => void;
}

const isToolMessage = (content: string): ToolMessage | null => {
  try {
    const parsed = JSON.parse(content);
    if (
      (parsed.type === 'progress_steps' && Array.isArray(parsed.steps)) ||
      (parsed.type === 'tool_ui' && parsed.tool)
    ) {
      return parsed as ToolMessage;
    }
  } catch (e) {
    console.log('Not a valid tool message:', content);
  }
  return null;
};

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
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [selectedTrial, setSelectedTrial] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'trial' | 'site' | 'date' | 'confirm'>('greeting');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        } else if (currentStep === 'confirm') {
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

  const renderMessage = (message: Message) => {
    if (typeof message.content === 'string') {
      const toolMessage = isToolMessage(message.content);
      if (toolMessage) {
        if (toolMessage.type === 'progress_steps') {
          return <ProgressSteps steps={toolMessage.steps || []} />;
        } else if (toolMessage.type === 'tool_ui' && toolMessage.tool) {
          const { type, message: toolMsg, options } = toolMessage.tool;
          return (
            <>
              <p className="text-sm mb-2">{toolMsg}</p>
              <ToolUI
                type={type}
                value={
                  type === 'trial'
                    ? selectedTrial
                    : type === 'site'
                    ? selectedSite
                    : type === 'date'
                    ? dateRange
                    : false
                }
                onChange={(value) => handleToolInput(type, value)}
                options={{
                  trials,
                  sites: selectedTrial ? sites[selectedTrial] : [],
                  datePickerProps:
                    type === 'date'
                      ? {
                          ref: datePickerRef,
                          targetRef: dateButtonRef,
                          isOpen: showDatePicker,
                          setIsOpen: setShowDatePicker,
                        }
                      : undefined,
                  buttonText: options?.buttonText,
                }}
              />
            </>
          );
        }
      }
    }

    // Split content by newlines and filter out empty lines
    const contentLines = message.content.split('\n').filter(line => line.trim().length > 0);

    return (
      <div className="flex flex-col">
        {!message.isUser && (
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {getAgentDisplayName(message.nodeName)}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {format(message.timestamp, 'p')}
            </span>
          </div>
        )}
        <div className="whitespace-pre-line">
          {contentLines.slice(1).map((line, index) => (
            <p key={index} className="text-sm text-gray-600 mb-2 last:mb-0">
              {line.trim()}
            </p>
          ))}
        </div>
        {message.isUser && (
          <p className="text-xs text-gray-500 mt-1">
            {format(message.timestamp, 'p')}
          </p>
        )}
      </div>
    );
  };

  const getMessageBackgroundColor = (message: Message) => {
    if (message.isUser) return 'bg-blue-500 text-white';
    
    switch (message.nodeName) {
      case 'critique_agent':
        return 'bg-red-100 text-gray-900';
      case 'reflection_agent':
        return 'bg-green-100 text-gray-900';
      case 'feedback_agent':
        return 'bg-yellow-100 text-gray-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-[680px] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Audit Agent</h2>
      </div>

      <div className="h-[560px] overflow-y-auto">
        <div className="p-4 space-y-4">
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
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${message.isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
            >
              <Avatar className={`h-8 w-8 ${message.isUser ? 'bg-blue-500' : 'bg-gray-100'}`}>
                <AvatarFallback className="text-gray-700">
                  <User className={`h-4 w-4 ${message.isUser ? 'text-white' : ''}`} />
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  getMessageBackgroundColor(message)
                }`}
              >
                {renderMessage(message)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => updateUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};