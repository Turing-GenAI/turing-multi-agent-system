import React, { useEffect, useRef } from 'react';
import { Send, User, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Message } from '../types';
import { ProgressSteps, Step } from './ProgressSteps';

interface ToolMessage {
  type: 'progress_steps';
  steps: Step[];
}

interface AgentWindowProps {
  messages: Message[];
  userInput: string;
  updateUserInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  suggestionText?: string;
}

const isToolMessage = (content: string): ToolMessage | null => {
  try {
    const parsed = JSON.parse(content);
    console.log('Parsed message:', parsed);
    if (parsed.type === 'progress_steps' && Array.isArray(parsed.steps)) {
      console.log('Valid tool message:', parsed);
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
  suggestionText,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessageContent = (message: Message) => {
    if (!message.isUser) {
      console.log('Checking message content:', message.content);
      const toolMessage = isToolMessage(message.content);
      if (toolMessage && toolMessage.type === 'progress_steps') {
        console.log('Rendering progress steps:', toolMessage.steps);
        return <ProgressSteps steps={toolMessage.steps} />;
      }
    }

    return (
      <>
        <p className="text-sm">{message.content}</p>
        <p className="text-xs mt-1 opacity-70">
          {format(message.timestamp, 'p')}
        </p>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Audit Agent</h2>
      </div>

      <div className="h-[480px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {(!messages || messages.length === 0) && suggestionText && (
            <div className="flex items-center space-x-2 text-gray-500 bg-gray-50 p-4 rounded-lg">
              <Lightbulb className="h-5 w-5" />
              <p className="text-sm">{suggestionText}</p>
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
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {renderMessageContent(message)}
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
            placeholder={suggestionText || "Type your message..."}
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