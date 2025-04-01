import React from 'react';
import { Send } from 'lucide-react';
import { MessageInputProps } from './types';

export const MessageInput: React.FC<MessageInputProps> = ({
  userInput,
  updateUserInput,
  handleSendMessage,
  disabled = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (userInput.trim()) {
        handleSendMessage(e);
      }
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (userInput.trim()) {
        handleSendMessage(e);
      }
    }} className="flex space-x-2">
      <input
        type="text"
        value={userInput}
        onChange={(e) => updateUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        className={`flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
      <button
        type="submit"
        disabled={disabled || !userInput.trim()}
        className={`w-10 h-10 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 ${
          disabled || !userInput.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`}
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};
