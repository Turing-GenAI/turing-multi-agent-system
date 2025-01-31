import React from 'react';
import { Send } from 'lucide-react';
import { MessageInputProps } from './types';

export const MessageInput: React.FC<MessageInputProps> = ({
  userInput,
  updateUserInput,
  handleSendMessage,
}) => {
  return (
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
  );
};
