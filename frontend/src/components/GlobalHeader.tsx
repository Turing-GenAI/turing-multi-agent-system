import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock user data - Replace with actual user data from your auth system
const mockUser = {
  name: 'John Doe',
  role: 'Clinical Trial Manager',
  avatar: null, // URL to user's avatar if available
};

interface GlobalHeaderProps {
  title?: string;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ title = 'Audit Compliance' }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [notificationCount] = React.useState(3); // Replace with actual notification count

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
              {title}
            </Link>
          </div>

          {/* Right side - Notifications and User Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {mockUser.avatar ? (
                    <img
                      src={mockUser.avatar}
                      alt={mockUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{mockUser.name}</p>
                  <p className="text-xs text-gray-500">{mockUser.role}</p>
                </div>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                  <button
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => {/* Add logout handler */}}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
