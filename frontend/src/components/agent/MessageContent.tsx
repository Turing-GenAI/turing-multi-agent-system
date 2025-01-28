import React from 'react';
import { format } from 'date-fns';
import { Message } from '../../types';
import { ProgressSteps } from '../ProgressSteps';
import { ToolUI } from '../ToolUI';
import { getAgentDisplayName } from '../../data/agentNames';
import { ToolMessage } from './types';

interface MessageContentProps {
  message: Message;
  selectedTrial: string;
  selectedSite: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
  handleToolInput: (type: 'trial' | 'site' | 'date' | 'button', value: any) => void;
  trials: string[];
  sites: { [key: string]: Array<{ id: string; status: string }> };
  datePickerRef: React.RefObject<HTMLDivElement>;
  dateButtonRef: React.RefObject<HTMLButtonElement>;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  isAnalysisStarted: boolean;
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
    // console.log('Not a valid tool message:', content);
  }
  return null;
};

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  selectedTrial,
  selectedSite,
  dateRange,
  handleToolInput,
  trials,
  sites,
  datePickerRef,
  dateButtonRef,
  showDatePicker,
  setShowDatePicker,
  isAnalysisStarted,
}) => {
  if (typeof message.content === 'string') {
    const toolMessage = isToolMessage(message.content);
    if (toolMessage) {
      if (toolMessage.type === 'progress_steps') {
        return <ProgressSteps steps={toolMessage.steps || []} />;
      } else if (toolMessage.type === 'tool_ui' && toolMessage.tool) {
        const { type, message: toolMsg, options } = toolMessage.tool;
        return (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{toolMsg}</p>
            <div className="mt-2">
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
                  isAnalysisStarted,
                }}
              />
            </div>
          </div>
        );
      }
    }
  }

  const contentLines = message.content.split('\n').filter(line => line.trim().length > 0);
  const isTyping = message.content === '';

  return (
    <div className="space-y-2">
      {!message.isUser && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">
            {getAgentDisplayName(message.nodeName)}
          </span>
          <span className="text-xs opacity-70">
            {format(message.timestamp, 'p')}
          </span>
        </div>
      )}
      <div className="space-y-2">
        {contentLines.map((line, index) => (
          <p 
            key={index} 
            className={`
              text-sm leading-relaxed
              ${message.isUser ? 'text-white' : 'text-gray-700'}
              ${line.length > 100 ? 'break-words' : ''}
            `}
          >
            {line.trim()}
            {index === contentLines.length - 1 && isTyping && (
              <span className="animate-pulse ml-0.5">▋</span>
            )}
          </p>
        ))}
      </div>
      {message.isUser && (
        <div className="flex justify-end">
          <span className="text-xs opacity-70 mt-1">
            {format(message.timestamp, 'p')}
          </span>
        </div>
      )}
    </div>
  );
};
