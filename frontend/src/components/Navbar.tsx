import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getLinkClasses = (path: string) => {
    const isActive = currentPath === path;
    return `relative px-3 py-2 transition-all duration-300 ease-in-out text-sm font-medium ${
      isActive 
        ? 'text-blue-600 font-semibold' 
        : 'text-gray-500 hover:text-gray-700'
    } flex items-center space-x-1 group`;
  };

  const getIndicatorClasses = (path: string) => {
    const isActive = currentPath === path;
    return `absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform transition-all duration-300 ease-in-out ${
      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-75 group-hover:bg-gray-300'
    }`;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                Audit Agent
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className={getLinkClasses('/dashboard')}
              >
                <span>Dashboard</span>
                <div className={getIndicatorClasses('/dashboard')}></div>
              </Link>
              <Link
                to="/inputs"
                className={getLinkClasses('/inputs')}
              >
                <span>Inputs</span>
                <div className={getIndicatorClasses('/inputs')}></div>
              </Link>
              <Link
                to="/audit"
                className={getLinkClasses('/audit')}
              >
                <span>Audit</span>
                <div className={getIndicatorClasses('/audit')}></div>
              </Link>
              {/* Temporarily hidden Agent Status tab
              <Link
                to="/agent"
                className={getLinkClasses('/agent')}
              >
                <span>Agent Status</span>
                <div className={getIndicatorClasses('/agent')}></div>
              </Link>
              */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
