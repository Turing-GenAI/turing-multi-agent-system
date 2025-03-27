import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentPath = location.pathname;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Handle clicks outside of the dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const getLinkClasses = (path: string) => {
    const isActive = currentPath === path;
    return `relative px-4 py-2 transition-all duration-300 ease-in-out text-sm font-medium ${
      isActive 
        ? 'text-blue-600 font-semibold' 
        : 'text-gray-500 hover:text-blue-500'
    } flex items-center space-x-2 group`;
  };

  const getIndicatorClasses = (path: string) => {
    const isActive = currentPath === path;
    return `absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform transition-all duration-300 ease-in-out ${
      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-75 group-hover:bg-blue-300'
    }`;
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800 flex items-center space-x-2 transition-all duration-300 hover:text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Audit Copilot</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <Link
                to="/dashboard"
                className={getLinkClasses('/dashboard')}
                aria-label="Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>Dashboard</span>
                <div className={getIndicatorClasses('/dashboard')}></div>
              </Link>
              <Link
                to="/inputs"
                className={getLinkClasses('/inputs')}
                aria-label="Inputs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Inputs</span>
                <div className={getIndicatorClasses('/inputs')}></div>
              </Link>
              <Link
                to="/audit"
                className={getLinkClasses('/audit')}
                aria-label="Copilot"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Copilot</span>
                <div className={getIndicatorClasses('/audit')}></div>
              </Link>
              {/* Temporarily hidden Agent Status tab
              <Link
                to="/agent"
                className={getLinkClasses('/agent')}
                aria-label="Agent Status"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Agent Status</span>
                <div className={getIndicatorClasses('/agent')}></div>
              </Link>
              */}
            </div>
          </div>

          {/* User Profile Section */}
          {isAuthenticated && user && (
            <div className="flex items-center ml-auto mr-3" ref={dropdownRef}>
              <div className="relative">
                <div>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center text-sm rounded-lg bg-gray-50 hover:bg-blue-50 px-3 py-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                      <div className="relative">
                        <img
                          className="h-8 w-8 rounded-full border-2 border-blue-100 shadow-sm"
                          src={user.picture}
                          alt={user.name}
                        />
                        {dropdownOpen && (
                          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-white"></span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
                {dropdownOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-52 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 ease-out"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                      role="menuitem"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
            
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden ml-auto">
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, hidden by default */}
      <div className="sm:hidden hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link to="/dashboard" className={`block pl-3 pr-4 py-2 ${currentPath === '/dashboard' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Dashboard
          </Link>
          <Link to="/inputs" className={`block pl-3 pr-4 py-2 ${currentPath === '/inputs' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Inputs
          </Link>
          <Link to="/audit" className={`block pl-3 pr-4 py-2 ${currentPath === '/audit' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Copilot
          </Link>
        </div>
      </div>
    </nav>
  );
};
