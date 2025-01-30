import React from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Message } from '../../types';
import { MessageContent } from './MessageContent';
import { getMessageBackgroundColor } from './utils';

interface MessageBubbleProps {
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({
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
  console.log("MessageBubble: ", message);
  // Get background color based on message type
  const backgroundStyle = getMessageBackgroundColor(message);
  
  // Define bubble styles based on sender
  const bubbleStyles = message.isUser
    ? 'rounded-2xl rounded-tr-sm ml-auto shadow-md'
    : 'rounded-2xl rounded-tl-sm mr-auto shadow-sm border';

  // Define container styles based on sender
  const containerStyles = message.isUser
    ? 'flex-row-reverse space-x-reverse'
    : 'flex-row';

  return (
    <div className={`flex items-end space-x-2 group ${containerStyles}`}>
      <div className="flex-shrink-0">
        <Avatar 
          className={`h-8 w-8 transition-transform duration-200 group-hover:scale-110 ${
            message.isUser ? 'bg-blue-500 shadow-sm' : 'bg-gray-100 border border-gray-200'
          }`}
        >
          <AvatarFallback className={message.isUser ? 'text-white' : 'text-gray-700'}>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>

      <div 
        className={`
          relative max-w-[100%] min-w-[60px] p-4 
          transition-all duration-200
          hover:shadow-lg
          ${bubbleStyles}
          ${backgroundStyle}
        `}
      >
        <MessageContent
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
      </div>
    </div>
  );
};
