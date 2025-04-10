import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emails: string[]) => void;
  reviewResults: {
    totalIssues: number;
    acceptedIssues: number;
    rejectedIssues: number;
    pendingIssues: number;
  };
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, onSend, reviewResults }) => {
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');

  const handleSend = () => {
    // Basic email validation
    const emails = emailInput.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      setError(`Invalid email(s): ${invalidEmails.join(', ')}`);
      return;
    }

    onSend(emails);
    setEmailInput('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Send Review Results</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Review Summary</h4>
          <div className="bg-gray-50 p-3 rounded">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total Issues:</div>
              <div>{reviewResults.totalIssues}</div>
              <div>Accepted Issues:</div>
              <div className="text-green-600">{reviewResults.acceptedIssues}</div>
              <div>Rejected Issues:</div>
              <div className="text-red-600">{reviewResults.rejectedIssues}</div>
              <div>Pending Issues:</div>
              <div className="text-yellow-600">{reviewResults.pendingIssues}</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Owner Email(s)
          </label>
          <input
            type="text"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setError('');
            }}
            placeholder="Enter email addresses (comma-separated)"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            For multiple recipients, separate email addresses with commas
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}; 