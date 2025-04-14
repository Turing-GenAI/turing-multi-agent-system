import React, { useState, useEffect } from 'react';
import { complianceAPI } from '../services/api';
import { ReviewInfo, ReviewAlertRequest } from '../types';
import { cacheEmailContent, getCachedEmailContent } from '../utils/cacheUtils';

interface EmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewInfo | null;
  onSendSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const EmailAlertModal: React.FC<EmailAlertModalProps> = ({
  isOpen,
  onClose,
  review,
  onSendSuccess,
  onError
}) => {
  const [emailAddresses, setEmailAddresses] = useState<string>('');
  const [sendingAlert, setSendingAlert] = useState<boolean>(false);
  const [emailContent, setEmailContent] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [isLoadingEmailContent, setIsLoadingEmailContent] = useState<boolean>(false);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState<boolean>(false);

  // Reset the form state when the modal opens with a new review
  useEffect(() => {
    if (isOpen && review) {
      setEmailSubject(`Compliance Review Alert - ${review.clinicalDoc}`);
      setEmailAddresses('');
      loadEmailContent();
    }
  }, [isOpen, review]);

  // Load email content - first try from cache, then generate if needed
  const loadEmailContent = async () => {
    if (!review) return;
    setIsLoadingFromCache(true);
    
    try {
      // Try to get content from cache first
      const cachedData = await getCachedEmailContent(review.id);
      
      if (cachedData) {
        console.log('Using cached email content for review:', review.id);
        setEmailContent(cachedData.content);
        setEmailSubject(cachedData.subject || `Compliance Review Alert - ${review.clinicalDoc}`);
        setIsLoadingFromCache(false);
        return;
      }
      
      // No cache hit, generate content
      setIsLoadingFromCache(false);
      await generateEmailContent();
    } catch (error) {
      console.error('Error loading email content from cache:', error);
      setIsLoadingFromCache(false);
      await generateEmailContent();
    }
  };

  // Function to generate email content using LLM
  const generateEmailContent = async () => {
    if (!review) return;
    
    setIsLoadingEmailContent(true);
    try {
      // Fetch decision history for this review
      let decisionHistory = [];
      try {
        if (review.id) {
          const history = await complianceAPI.getReviewDecisions(review.id);
          decisionHistory = history;
        }
      } catch (historyError) {
        console.error('Error fetching decision history:', historyError);
        // Continue even if decision history fetch fails
      }
      
      const response = await complianceAPI.generateReviewAlertContent({
        to_emails: emailAddresses.split(',').map(email => email.trim()),
        subject: emailSubject,
        review_data: {
          clinical_doc: review.clinicalDoc,
          compliance_doc: review.complianceDoc,
          issues: review.issues || 0,
          high_confidence_issues: review.highConfidenceIssues || 0,
          low_confidence_issues: review.lowConfidenceIssues || 0,
          decision_history: decisionHistory
        }
      } as ReviewAlertRequest);
      
      if (response.content) {
        setEmailContent(response.content);
        
        // Cache the generated content
        if (review.id) {
          try {
            await cacheEmailContent(review.id, response.content, emailSubject);
            console.log('Email content cached for review:', review.id);
          } catch (cacheError) {
            console.error('Failed to cache email content:', cacheError);
            // Non-critical error, continue without caching
          }
        }
      }
    } catch (error) {
      console.error('Error generating email content:', error);
      onError('Failed to generate email content. Please try again.');
    } finally {
      setIsLoadingEmailContent(false);
    }
  };

  // Handle sending alerts to document owners
  const handleSendAlert = async () => {
    if (!review || !emailAddresses.trim()) return;

    setSendingAlert(true);
    try {
      // Fetch decision history for this review
      let decisionHistory = [];
      try {
        if (review.id) {
          const history = await complianceAPI.getReviewDecisions(review.id);
          decisionHistory = history;
        }
      } catch (historyError) {
        console.error('Error fetching decision history:', historyError);
        // Continue even if decision history fetch fails
      }
      
      await complianceAPI.sendReviewAlert({
        to_emails: emailAddresses.split(',').map(email => email.trim()),
        subject: emailSubject || `Compliance Review Alert - ${review.clinicalDoc}`,
        content: emailContent,
        review_data: {
          clinical_doc: review.clinicalDoc,
          compliance_doc: review.complianceDoc,
          issues: review.issues || 0,
          high_confidence_issues: review.highConfidenceIssues || 0,
          low_confidence_issues: review.lowConfidenceIssues || 0,
          decision_history: decisionHistory
        }
      } as ReviewAlertRequest);

      onSendSuccess('Alert sent successfully to document owners.');
      handleCloseModal();
    } catch (error) {
      console.error('Error sending alert:', error);
      onError('Failed to send alert. Please try again.');
    } finally {
      setSendingAlert(false);
    }
  };

  const handleCloseModal = () => {
    setEmailContent('');
    setEmailSubject('');
    setEmailAddresses('');
    onClose();
  };

  if (!isOpen || !review) return null;

  // Handle backdrop click - close the modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the click is directly on the backdrop element
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full h-[85vh] flex flex-col">
        {/* Header - fixed */}
        <div className="px-6 py-4 border-b flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-slate-800">Send Compliance Alert</h3>
          <button 
            onClick={handleCloseModal}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Content area - fixed height with internal scrolling only for email content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - no scroll */}
          <div className="w-80 bg-slate-50 p-5 border-r">
            <div className="space-y-5">
              <div>
                <h4 className="text-sm uppercase tracking-wider text-slate-500 font-medium mb-2">Review Details</h4>
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-1">Clinical Document</div>
                    <div className="font-medium text-slate-800 break-words">{review.clinicalDoc}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-1">Compliance Document</div>
                    <div className="font-medium text-slate-800 break-words">{review.complianceDoc}</div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-slate-500 mb-2">Issues Found</div>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 rounded-md px-3 py-2 flex-1 text-center">
                        <div className="text-lg font-semibold text-slate-800">{review.issues || 0}</div>
                        <div className="text-xs text-slate-600">Total</div>
                      </div>
                      <div className="bg-red-50 rounded-md px-3 py-2 flex-1 text-center">
                        <div className="text-lg font-semibold text-red-700">{review.highConfidenceIssues || 0}</div>
                        <div className="text-xs text-red-600">High</div>
                      </div>
                      <div className="bg-yellow-50 rounded-md px-3 py-2 flex-1 text-center">
                        <div className="text-lg font-semibold text-yellow-700">{review.lowConfidenceIssues || 0}</div>
                        <div className="text-xs text-yellow-600">Low</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm uppercase tracking-wider text-slate-500 font-medium mb-2">Recipients</h4>
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Addresses
                  </label>
                  <input
                    type="text"
                    value={emailAddresses}
                    onChange={(e) => setEmailAddresses(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:text-slate-400"
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Enter comma-separated email addresses
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content - fixed layout with internal scrolling only for the email content */}
          <div className="flex-1 flex flex-col">
            <div className="p-5 flex flex-col h-full">
              <div className="mb-4 flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:text-slate-400"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex-shrink-0">
                  Email Content
                </label>
                {isLoadingFromCache ? (
                  <div className="flex items-center justify-center p-10 border border-slate-300 rounded-md bg-slate-50 h-full">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                      <div className="text-slate-500 text-sm">Loading email content from cache...</div>
                    </div>
                  </div>
                ) : isLoadingEmailContent ? (
                  <div className="flex items-center justify-center p-10 border border-slate-300 rounded-md bg-slate-50 h-full">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                      <div className="text-slate-500 text-sm">Generating email content...</div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-300 rounded-md overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="bg-slate-50 p-2 border-b flex items-center gap-2 flex-shrink-0">
                      <button 
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded"
                        title="Template"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1"></path>
                          <path d="M12 17v.01"></path>
                          <rect x="8" y="7" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                      </button>
                      <button 
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <div className="h-5 border-r border-slate-300 mx-1"></div>
                      <button 
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded"
                        onClick={generateEmailContent}
                        title="Regenerate content"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                          <path d="M21 3v5h-5"></path>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                          <path d="M8 16H3v5"></path>
                        </svg>
                      </button>
                      <div className="h-5 border-r border-slate-300 mx-1"></div>
                      <button 
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded"
                        title="Format"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 15h12"></path>
                          <path d="M10 7h4"></path>
                          <path d="M11 11h2"></path>
                          <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"></path>
                        </svg>
                      </button>
                    </div>
                    <textarea
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="w-full p-3 flex-1 resize-none focus:outline-none focus:ring-0 text-sm overflow-y-auto"
                      placeholder="Enter email content..."
                    />
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2 italic flex-shrink-0">
                  <div>The email will be sent in both plain text and HTML format.</div>
                  {emailContent && !isLoadingEmailContent && !isLoadingFromCache && (
                    <div className="text-green-600 font-medium non-italic flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                      Using cached content
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer - fixed */}
        <div className="border-t px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
            onClick={handleCloseModal}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none"
            onClick={handleSendAlert}
            disabled={sendingAlert || !emailAddresses.trim() || !emailContent.trim()}
          >
            {sendingAlert ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              <>Send Alert</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 