import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { PrivacyPolicyModal } from '../components/modals/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../components/modals/TermsOfServiceModal';
import { ContactSupportModal } from '../components/modals/ContactSupportModal';
import { User, Lock, Mail, AlertCircle, BrainCircuit, CheckCircle, Shield, LogIn, UserPlus } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, registerWithEmail, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [animatingForm, setAnimatingForm] = useState(false);
  const [loginFormHeight, setLoginFormHeight] = useState<number | null>(null);
  const [registerFormHeight, setRegisterFormHeight] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  // Modal state
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Measure form heights for both states
  useEffect(() => {
    if (animatingForm) return;

    // After rendering, measure current form height
    if (formRef.current) {
      const currentHeight = formRef.current.offsetHeight;
      
      // Store the height based on the current mode
      if (isRegistering) {
        setRegisterFormHeight(currentHeight);
      } else {
        setLoginFormHeight(currentHeight);
      }
    }
  }, [isRegistering, animatingForm, email, password, name]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setIsLoading(true);
    setError('');

    try {
      let success;
      
      if (isRegistering) {
        if (!name) {
          setError('Name is required');
          setIsLoading(false);
          setFormSubmitted(false);
          return;
        }
        success = await registerWithEmail(name, email, password);
        if (!success) {
          setError('Registration failed. Email may already be in use.');
        }
      } else {
        success = await loginWithEmail(email, password);
        if (!success) {
          setError('Invalid email or password');
        }
      }
      
      if (success) {
        // Add a slight delay before navigation for a better user experience
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        setFormSubmitted(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
      setFormSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    // Prevent multiple clicks
    if (animatingForm) return;
    
    // Start form transition animation
    setAnimatingForm(true);
    setFormSubmitted(true);
    
    // Prepare the container for animation - set explicit height
    if (formContainerRef.current && formRef.current) {
      // Set initial height
      const initialHeight = formRef.current.offsetHeight;
      formContainerRef.current.style.height = `${initialHeight}px`;
      
      // Calculate target height based on the form we're switching to
      const targetHeight = isRegistering 
        ? (loginFormHeight || initialHeight - 70) // When going from register to login (smaller)
        : (registerFormHeight || initialHeight + 70); // When going from login to register (larger)
      
      // After brief delay, smoothly transition to target height
      requestAnimationFrame(() => {
        if (formContainerRef.current) {
          formContainerRef.current.style.height = `${targetHeight}px`;
        }
        
        // Switch form type after height begins changing
        setTimeout(() => {
          setIsRegistering(!isRegistering);
          setError('');
          
          // After form type change, allow form to become visible
          setTimeout(() => {
            setFormSubmitted(false);
            
            // Complete animation and reset heights
            setTimeout(() => {
              setAnimatingForm(false);
              if (formContainerRef.current) {
                formContainerRef.current.style.height = 'auto';
              }
            }, 400);
          }, 300);
        }, 350);
      });
    }
  };

  // Custom Google button renderer to allow for changing text based on mode
  const renderGoogleButton = () => {
    return (
      <GoogleLogin
        onSuccess={loginWithGoogle}
        onError={() => {
          setError('Google Sign In failed. Please try again.');
        }}
        width="100%"
        theme="filled_blue"
        text={isRegistering ? "signup_with" : "signin_with"}
        locale="en"
      />
    );
  };

  // CSS classes for form animation
  const formClasses = `space-y-3 transition-all duration-700 ease-in-out ${
    formSubmitted ? 'opacity-70 transform scale-98' : 'opacity-100 transform scale-100'
  } ${animatingForm ? 'blur-[2px]' : ''}`;

  // Form container styles
  const formContainerStyles = {
    transition: 'height 800ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 700ms ease-in-out',
    overflow: 'hidden',
    position: 'relative' as const,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-white flex items-center justify-center p-2 sm:p-4 relative">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500 blur-3xl"></div>
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-indigo-600 blur-3xl"></div>
        <div className="absolute bottom-10 left-1/4 w-72 h-72 rounded-full bg-blue-400 blur-3xl"></div>
      </div>
      
      {/* Login Container */}
      <div className="w-full max-w-4xl flex overflow-hidden rounded-2xl shadow-2xl z-10 relative bg-white bg-opacity-80 backdrop-blur-sm">
        {/* Left Side - Branding */}
        <div className="hidden md:block w-1/2 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#pattern)" />
            </svg>
            <defs>
              <pattern id="pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="2" fill="white" />
              </pattern>
            </defs>
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            {/* Logo Placeholder */}
            <div className="text-3xl font-bold tracking-tight mb-4 flex items-center">
              <div className="bg-white rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="bg-white text-blue-600 px-2 py-1 rounded">Audit</span>
              <span className="ml-1">Copilot</span>
            </div>
            
            <h2 className="text-xl font-semibold mb-4">Welcome to the future of audit management</h2>
            
            <div className="mt-auto space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <p className="text-sm">AI-powered tools to streamline your audit workflows</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-sm">Simplified compliance verification and analysis</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-sm">Secure, reliable, and compliant with standards</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm p-5 sm:p-6 relative">
          {/* Subtle Form Background Pattern */}
          <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="text-indigo-800">
              <defs>
                <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#smallGrid)" />
            </svg>
          </div>
          
          <div className="max-w-md mx-auto relative">
            <div className="text-center mb-5">
              <div className="md:hidden flex items-center justify-center mb-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full p-2 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-800">Audit Copilot</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center mb-1">
                  {isRegistering ? (
                    <UserPlus className="h-5 w-5 text-indigo-600 mr-2" />
                  ) : (
                    <LogIn className="h-5 w-5 text-indigo-600 mr-2" />
                  )}
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                    {isRegistering ? 'Create Your Account' : 'Welcome Back'}
                  </h1>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-1 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                </div>
                <p className="text-gray-600 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                  {isRegistering 
                    ? 'Join Audit Copilot to streamline your workflows' 
                    : 'Access your dashboard securely'}
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-md animate-fade-in">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            <div ref={formContainerRef} style={formContainerStyles}>
              <form ref={formRef} onSubmit={handleEmailSubmit} className={formClasses}>
                {isRegistering && (
                  <div className="relative transition-all duration-700 ease-in-out transform-gpu animate-fade-slide-down">
                    <label htmlFor="name" className="text-xs font-medium text-gray-700 mb-1 block">Full Name</label>
                    <div className="relative p-[2px]">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                )}
                
                <div className="relative transition-all duration-700 ease-in-out transform-gpu">
                  <label htmlFor="email" className="text-xs font-medium text-gray-700 mb-1 block">Email Address</label>
                  <div className="relative p-[2px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="relative transition-all duration-700 ease-in-out transform-gpu">
                  <label htmlFor="password" className="text-xs font-medium text-gray-700 mb-1 block">Password</label>
                  <div className="relative p-[2px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-4 text-sm rounded-lg shadow-md transition-all duration-500 transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex justify-center items-center ${
                    isLoading ? 'opacity-90' : 'hover:translate-y-[-1px]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isRegistering ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    isRegistering ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>
            </div>
            
            <div className="text-center my-3">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium focus:outline-none transition-all duration-700 transform hover:scale-105 active:scale-95"
                disabled={isLoading || animatingForm}
              >
                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Create one'}
              </button>
            </div>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">or continue with</span>
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              {renderGoogleButton()}
            </div>
          
            <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 mt-4">
              <p className="text-xs text-center text-gray-500">
                By signing in, you agree to our 
                <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-blue-600 hover:text-blue-800 mx-1 text-xs hover:underline transition-colors duration-200">
                  Terms of Service
                </button>
                and
                <button type="button" onClick={() => setIsPrivacyModalOpen(true)} className="text-blue-600 hover:text-blue-800 ml-1 text-xs hover:underline transition-colors duration-200">
                  Privacy Policy
                </button>
              </p>
              <p className="text-xs text-center text-gray-500 mt-1">
                <button onClick={() => setIsContactModalOpen(true)} className="hover:text-blue-600 transition-colors duration-200">Contact Support</button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      <TermsOfServiceModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <ContactSupportModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
};
