import React from 'react';
import { Bot } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-3 hover:text-blue-600">
              <Bot className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-semibold text-gray-800">Audit Compliance</h1>
            </Link>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(), 'MMMM d, yyyy')}
          </div>
        </div>
      </div>
    </header>
  );
};