import React from 'react';
import { Send } from 'lucide-react';
import { MessageInputProps } from './types';

export const MessageInput: React.FC<MessageInputProps> = ({
  userInput,
  updateUserInput,
  handleSendMessage,
  disabled = false,
}) => {
  return (
    <form onSubmit={handleSendMessage} className="flex space-x-2">
      <input
        type="text"
        value={userInput}
        onChange={(e) => updateUserInput(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
      <button
        type="submit"
        disabled={disabled}
        className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
