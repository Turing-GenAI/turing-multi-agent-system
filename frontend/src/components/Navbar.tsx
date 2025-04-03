import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { 
  LayoutDashboard, 
  FileEdit, 
  Bot, 
  Menu, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="bg-card/80 border-b border-border h-16 flex items-center sticky top-0 z-50 shadow-sm backdrop-blur-sm">
      <div className="w-full flex items-center justify-between px-4 md:px-6">
        {/* Left section with logo */}
        <div className="flex items-center space-x-2">
          <img 
            src="/images/logo.jpg" 
            alt="Audit Copilot Logo" 
            className="h-8 w-8 rounded-full object-cover"
          />
          <Link to="/" className="text-foreground font-semibold text-lg">
            Audit Copilot
          </Link>
        </div>

        {/* Center section with navigation */}
        <div className="hidden md:flex md:items-center space-x-1">
          <Link 
            to="/dashboard" 
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors",
              isActive('/dashboard') 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            to="/inputs" 
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors",
              isActive('/inputs') 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileEdit className="h-4 w-4" />
            <span>Document Center</span>
          </Link>
          
          <Link 
            to="/audit" 
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors",
              isActive('/audit') 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="h-4 w-4" />
            <span>Audit Workspace</span>
          </Link>
        </div>

        {/* Right section with theme toggle and profile */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
            
          {/* User Profile Section */}
          {isAuthenticated && user && (
            <div className="flex items-center" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center justify-center w-8 h-8 rounded-full focus:outline-none"
                  id="user-menu"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.picture}
                    alt={user.name}
                  />
                </button>
                
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg ring-1 ring-border py-1 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
            
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button className="p-2 rounded-md text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, hidden by default */}
      <div className="md:hidden hidden absolute top-16 left-0 right-0 bg-card shadow-md border-b border-border">
        <div className="py-2 space-y-1 px-4">
          <Link to="/dashboard" className={cn(
            "block px-3 py-2 rounded-md text-sm font-medium",
            isActive('/dashboard') 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}>
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </Link>
          <Link to="/inputs" className={cn(
            "block px-3 py-2 rounded-md text-sm font-medium",
            isActive('/inputs') 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}>
            <div className="flex items-center space-x-2">
              <FileEdit className="h-4 w-4" />
              <span>Inputs</span>
            </div>
          </Link>
          <Link to="/audit" className={cn(
            "block px-3 py-2 rounded-md text-sm font-medium",
            isActive('/audit') 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}>
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>Copilot</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};
