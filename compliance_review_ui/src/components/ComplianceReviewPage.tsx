import React, { useState, useEffect } from 'react';
import { documentAPI, complianceAPI } from '../services/api';
import { FiX, FiCheck, FiExternalLink, FiChevronRight, FiChevronLeft, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface ComplianceIssue {
  id: string;
  clinical_text: string;
  compliance_text: string;
  explanation: string;
  suggested_edit: string;
  confidence: 'high' | 'low';
  regulation: string;
  status?: 'accepted' | 'rejected' | 'pending';
}

interface ComplianceReviewPageProps {
  clinicalDocument: {
    id: string;
    title: string;
    content: string;
  };
  complianceDocument: {
    id: string;
    title: string;
    content: string;
  };
  issues: ComplianceIssue[];
  onClose: () => void;
  onSaveDecisions: (decisions: { issueId: string; status: 'accepted' | 'rejected'; appliedChange?: string | null }[]) => void;
}

export const ComplianceReviewPage: React.FC<ComplianceReviewPageProps> = ({ 
  clinicalDocument, 
  complianceDocument, 
  issues, 
  onClose,
  onSaveDecisions
}) => {
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [reviewedIssues, setReviewedIssues] = useState<ComplianceIssue[]>([...issues]);
  const [showHistory, setShowHistory] = useState(false);
  const [clinicalContent, setClinicalContent] = useState<string>('');
  const [complianceContent, setComplianceContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [appliedChanges, setAppliedChanges] = useState<Map<string, string>>(new Map());
  const [processingEdit, setProcessingEdit] = useState<boolean>(false);
  
  const currentIssue = reviewedIssues[currentIssueIndex] || null;
  
  // Fetch document content from the backend
  useEffect(() => {
    const fetchDocumentContent = async () => {
      try {
        setLoading(true);
        
        // Only fetch if we have valid document IDs
        if (clinicalDocument.id && complianceDocument.id) {
          // Fetch clinical document content
          const clinicalContentData = await documentAPI.getDocumentContent(clinicalDocument.id);
          setClinicalContent(clinicalContentData);
          
          // Fetch compliance document content
          const complianceContentData = await documentAPI.getDocumentContent(complianceDocument.id);
          setComplianceContent(complianceContentData);
        }
      } catch (err) {
        console.error('Error fetching document content:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentContent();
  }, [clinicalDocument.id, complianceDocument.id]);
  
  // Function to navigate between issues
  const navigateIssue = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIssueIndex < reviewedIssues.length - 1) {
      setCurrentIssueIndex(currentIssueIndex + 1);
    } else if (direction === 'prev' && currentIssueIndex > 0) {
      setCurrentIssueIndex(currentIssueIndex - 1);
    }
  };
  
  // Function to scroll to the currently selected issue
  const scrollToCurrentIssue = () => {
    if (currentIssue) {
      setTimeout(() => {
        const issueElement = document.getElementById(`issue-${currentIssue.id}`);
        if (issueElement) {
          issueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a temporary highlight effect
          issueElement.classList.add('ring-2', 'ring-opacity-100');
          setTimeout(() => {
            issueElement.classList.remove('ring-opacity-100');
          }, 1000);
        }
      }, 100); // Small delay to ensure DOM is updated
    }
  };
  
  // Scroll to the selected issue when currentIssueIndex changes
  useEffect(() => {
    if (!loading) {
      scrollToCurrentIssue();
    }
  }, [currentIssueIndex, loading]);
  
  // Handle issue decisions (accept/reject)
  const handleDecision = async (decision: 'accepted' | 'rejected') => {
    const updatedIssues = [...reviewedIssues];
    const issueToUpdate = updatedIssues[currentIssueIndex];
    
    // Update the issue status
    issueToUpdate.status = decision;
    setReviewedIssues(updatedIssues);
    
    // If accepted, use the LLM to intelligently apply the edit
    if (decision === 'accepted') {
      try {
        setProcessingEdit(true);
        
        // Get surrounding context (100 chars before and after the text)
        const textToReplace = issueToUpdate.clinical_text;
        const content = displayClinicalContent;
        const textIndex = content.indexOf(textToReplace);
        
        if (textIndex !== -1) {
          const contextStart = Math.max(0, textIndex - 100);
          const contextEnd = Math.min(content.length, textIndex + textToReplace.length + 100);
          const surroundingContext = content.substring(contextStart, contextEnd);
          
          // Call the API to get the intelligently revised text
          const result = await complianceAPI.applySuggestion({
            clinical_text: textToReplace,
            suggested_edit: issueToUpdate.suggested_edit,
            surrounding_context: surroundingContext
          });
          
          // Store the LLM-generated revised text
          const newAppliedChanges = new Map(appliedChanges);
          newAppliedChanges.set(textToReplace, result.revised_text);
          setAppliedChanges(newAppliedChanges);
          console.log('Applied intelligent edit:', result.revised_text);
        } else {
          console.error('Could not find text to replace in document content');
        }
      } catch (error) {
        console.error('Error applying suggestion:', error);
        // Fallback: use the suggested edit directly
        const newAppliedChanges = new Map(appliedChanges);
        newAppliedChanges.set(issueToUpdate.clinical_text, issueToUpdate.suggested_edit);
        setAppliedChanges(newAppliedChanges);
      } finally {
        setProcessingEdit(false);
      }
    } else if (decision === 'rejected' && appliedChanges.has(issueToUpdate.clinical_text)) {
      // If rejected and there was a previously applied change, remove it
      const newAppliedChanges = new Map(appliedChanges);
      newAppliedChanges.delete(issueToUpdate.clinical_text);
      setAppliedChanges(newAppliedChanges);
    }
    
    // Auto-advance to the next issue after a brief delay
    if (currentIssueIndex < reviewedIssues.length - 1) {
      setTimeout(() => {
        navigateIssue('next');
      }, 500);
    }
  };
  
  // Finalize review and save decisions
  const finalizeReview = () => {
    const decisions = reviewedIssues
      .filter(issue => issue.status)
      .map(issue => ({
        issueId: issue.id,
        status: issue.status as 'accepted' | 'rejected',
        appliedChange: issue.status === 'accepted' && appliedChanges.has(issue.clinical_text) 
          ? appliedChanges.get(issue.clinical_text) 
          : undefined
      }));
    
    onSaveDecisions(decisions);
  };
  
  // Get the content to display - use modified content when available
  const displayClinicalContent = clinicalContent || clinicalDocument.content;
  const displayComplianceContent = complianceContent || complianceDocument.content;
  
  // Highlight non-compliant text in clinical document
  const highlightClinicalText = (content: string) => {
    if (!content || content.trim() === '') return content;
    let highlightedContent = content;
    
    reviewedIssues.forEach((issue, index) => {
      if (!issue.clinical_text || issue.clinical_text.trim() === '') return;
      
      const textToHighlight = issue.clinical_text;
      
      // If this text has an accepted change, use the suggested edit instead
      if (issue.status === 'accepted' && appliedChanges.has(textToHighlight)) {
        const suggestedEdit = appliedChanges.get(textToHighlight);
        
        // Use vibrant green to indicate accepted change
        const acceptedClass = 'bg-green-200 hover:bg-green-300 text-green-900';
        const isCurrentClass = index === currentIssueIndex ? 'ring-2 ring-blue-500' : '';
        
        try {
          // Normalize whitespace and escape regex characters
          const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();
          const normalizedContent = normalizeText(content);
          const normalizedTextToHighlight = normalizeText(textToHighlight);
          
          const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const escapedText = escapeRegExp(normalizedTextToHighlight);
          
          // Try to find the text
          if (normalizedContent.includes(normalizedTextToHighlight)) {
            const flexRegex = new RegExp(escapedText.replace(/\s+/g, '\\s+'), 'g');
            
            highlightedContent = highlightedContent.replace(
              flexRegex,
              `<span 
                id="issue-${issue.id}" 
                class="${acceptedClass} ${isCurrentClass} px-2 py-1 border-b-2 cursor-pointer rounded-md shadow-sm transition-colors font-medium" 
                onclick="document.dispatchEvent(new CustomEvent('issueClick', {detail: ${index}}))"
              >
                ${suggestedEdit} <span class="text-xs italic text-green-700">(edited)</span>
              </span>`
            );
          }
        } catch (error) {
          console.error('Error applying accepted edit:', error);
        }
      } else {
        // Regular highlighting for other issues
        // Use more vibrant colors with stronger contrast
        const confidenceClass = issue.confidence === 'high' 
          ? 'bg-red-300 hover:bg-red-400 text-red-900' 
          : 'bg-yellow-300 hover:bg-yellow-400 text-yellow-900';
        const statusClass = issue.status === 'accepted' 
          ? 'border-green-600 border-b-2' 
          : issue.status === 'rejected' 
            ? 'border-red-600 border-b-2' 
            : 'border-gray-400 border-b-2';
        const isCurrentClass = index === currentIssueIndex ? 'ring-2 ring-blue-500' : '';
        
        try {
          // Normalize whitespace in both the content and the text to highlight
          const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();
          const normalizedContent = normalizeText(content);
          const normalizedTextToHighlight = normalizeText(textToHighlight);
          
          // Escape special regex characters
          const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const escapedText = escapeRegExp(normalizedTextToHighlight);
          
          // Try different matching approaches in order of precision
          let matched = false;
          
          // 1. Try exact matching first (with normalized whitespace)
          if (normalizedContent.includes(normalizedTextToHighlight)) {
            // Use a regex that can handle flexible whitespace
            const flexRegex = new RegExp(escapedText.replace(/\s+/g, '\\s+'), 'g');
            
            highlightedContent = highlightedContent.replace(
              flexRegex,
              `<span 
                id="issue-${issue.id}" 
                class="${confidenceClass} ${statusClass} ${isCurrentClass} px-2 py-1 border-b-2 cursor-pointer rounded-md shadow-sm transition-colors font-medium" 
                onclick="document.dispatchEvent(new CustomEvent('issueClick', {detail: ${index}}))"
              >
                $&
              </span>`
            );
            matched = true;
          }
          
          // 2. If exact matching fails, try fuzzy matching with word boundaries
          if (!matched && normalizedTextToHighlight.length > 10) {
            // For longer strings, try matching initial words (minimum 10 chars)
            const words = normalizedTextToHighlight.split(' ');
            const firstFewWords = words.slice(0, Math.min(5, words.length)).join(' ');
            
            if (firstFewWords.length >= 10) {
              const partialRegex = new RegExp(escapeRegExp(firstFewWords) + '[\\s\\S]{0,50}', 'g');
              
      highlightedContent = highlightedContent.replace(
                partialRegex,
                (match) => {
                  return `<span 
                    id="issue-${issue.id}" 
                    class="${confidenceClass} ${statusClass} ${isCurrentClass} px-2 py-1 border-b-2 cursor-pointer rounded-md shadow-sm transition-colors font-medium" 
                    onclick="document.dispatchEvent(new CustomEvent('issueClick', {detail: ${index}}))"
                  >
                    ${match}
                  </span>`;
                }
              );
              matched = true;
            }
          }
          
          // 3. Log if no match was found for debugging
          if (!matched) {
            console.warn(`Could not find text match for issue: "${normalizedTextToHighlight.substring(0, 50)}..."`);
          }
        } catch (error) {
          console.error('Error highlighting clinical text:', error);
        }
      }
    });
    
    return highlightedContent;
  };
  
  // Highlight compliance text with improved styling
  const highlightComplianceText = (content: string, issueIndex: number) => {
    if (!reviewedIssues[issueIndex] || !content || content.trim() === '') return content;
    
    let highlightedContent = content;
    const textToHighlight = reviewedIssues[issueIndex].compliance_text;
    
    if (!textToHighlight || textToHighlight.trim() === '') return content;
    
    try {
      // Normalize whitespace in both the content and the text to highlight
      const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();
      const normalizedContent = normalizeText(content);
      const normalizedTextToHighlight = normalizeText(textToHighlight);
      
      // Escape special regex characters
      const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedText = escapeRegExp(normalizedTextToHighlight);
      
      // Try different matching approaches in order of precision
      let matched = false;
      
      // 1. Try exact matching first (with normalized whitespace)
      if (normalizedContent.includes(normalizedTextToHighlight)) {
        // Use a regex that can handle flexible whitespace
        const flexRegex = new RegExp(escapedText.replace(/\s+/g, '\\s+'), 'g');
        
        highlightedContent = highlightedContent.replace(
          flexRegex,
          `<span class="bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 py-1 rounded-md shadow-sm font-medium">$&</span>`
        );
        matched = true;
      }
      
      // 2. If exact matching fails, try fuzzy matching with word boundaries
      if (!matched && normalizedTextToHighlight.length > 10) {
        // For longer strings, try matching initial words (minimum 10 chars)
        const words = normalizedTextToHighlight.split(' ');
        const firstFewWords = words.slice(0, Math.min(5, words.length)).join(' ');
        
        if (firstFewWords.length >= 10) {
          const partialRegex = new RegExp(escapeRegExp(firstFewWords) + '[\\s\\S]{0,50}', 'g');
          
    highlightedContent = highlightedContent.replace(
            partialRegex,
            (match) => `<span class="bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 py-1 rounded-md shadow-sm font-medium">${match}</span>`
          );
          matched = true;
        }
      }
      
      // 3. Log if no match was found for debugging
      if (!matched) {
        console.warn(`Could not find compliance text match: "${normalizedTextToHighlight.substring(0, 50)}..."`);
      }
    } catch (error) {
      console.error('Error highlighting compliance text:', error);
    }
    
    return highlightedContent;
  };
  
  // Event listener for issue clicks in the document
  useEffect(() => {
    const handleIssueClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentIssueIndex(customEvent.detail);
    };
    
    document.addEventListener('issueClick', handleIssueClick);
    
    return () => {
      document.removeEventListener('issueClick', handleIssueClick);
    };
  }, []);
  
  return (
    <div className="flex-1 bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Compliance Review</h2>
          <span className="text-sm text-gray-500">#{clinicalDocument.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
          <button 
            onClick={finalizeReview}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Finalize review
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-2 h-[calc(100vh-64px)]">
        {/* Clinical Document Content with Highlights */}
        <div className="border-r overflow-auto p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4">{clinicalDocument.title}</h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="prose max-w-none flex-grow">
              <div dangerouslySetInnerHTML={{ 
                __html: highlightClinicalText(displayClinicalContent) 
              }} />
            </div>
              
              {/* Legend for highlighting */}
              {reviewedIssues.length > 0 && (
                <div className="mt-6 p-3 border-t bg-gray-50 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-red-300 rounded-sm"></span>
                    <span>High Confidence Issue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-yellow-300 rounded-sm"></span>
                    <span>Low Confidence Issue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 border-b-2 border-green-600"></span>
                    <span>Accepted Issue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 border-b-2 border-red-600"></span>
                    <span>Rejected Issue</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Compliance Panel */}
        <div className="overflow-auto">
          {/* Navigation between issues */}
          {!showHistory && (
            <div className="sticky top-0 bg-white border-b z-10 p-4 flex items-center justify-between">
              <button 
                onClick={() => navigateIssue('prev')}
                disabled={currentIssueIndex === 0}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <FiChevronLeft />
              </button>
              <span>Issue {currentIssueIndex + 1} of {reviewedIssues.length}</span>
              <button 
                onClick={() => navigateIssue('next')}
                disabled={currentIssueIndex === reviewedIssues.length - 1}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
          
          {!showHistory && currentIssue && (
            <div className="p-6">
              {/* Current issue details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    {currentIssue.confidence === 'high' ? (
                      <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        High Confidence
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Low Confidence
                      </span>
                    )}
                    <span>Compliance Issue</span>
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      className={`flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50 ${
                        currentIssue.status === 'accepted' ? 'bg-green-50 border-green-300' : ''
                      }`}
                      onClick={() => handleDecision('accepted')}
                      disabled={processingEdit}
                    >
                      {processingEdit ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiCheck className="w-4 h-4" />
                          Accept
                        </>
                      )}
                    </button>
                    <button 
                      className={`flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50 ${
                        currentIssue.status === 'rejected' ? 'bg-red-50 border-red-300' : ''
                      }`}
                      onClick={() => handleDecision('rejected')}
                      disabled={processingEdit}
                    >
                      <FiX className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Non-compliant text:</p>
                    <p className="text-sm bg-gray-100 p-2 rounded">{currentIssue.clinical_text}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Explanation:</p>
                    <p className="text-sm bg-gray-100 p-2 rounded">{currentIssue.explanation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Suggested edit:</p>
                    <p className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-400">
                      {currentIssue.suggested_edit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Relevant compliance document with highlighted text */}
              <div className="mt-6">
                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <span>Relevant Compliance</span>
                  <FiExternalLink className="w-4 h-4 text-gray-500" />
                </h5>
                <div className="bg-white p-4 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{currentIssue.regulation}</span>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div 
                      className="text-sm prose max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightComplianceText(displayComplianceContent, currentIssueIndex) 
                      }} 
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* History View */}
          {showHistory && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Decision History</h3>
              <div className="space-y-4">
                {reviewedIssues
                  .filter(issue => issue.status)
                  .map((issue, index) => (
                    <div key={issue.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Issue #{index + 1}</h4>
                        <div className="flex items-center gap-1">
                          {issue.status === 'accepted' ? (
                            <>
                              <FiCheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">Accepted</span>
                            </>
                          ) : (
                            <>
                              <FiXCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-600">Rejected</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm">{issue.clinical_text}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        Regulation: {issue.regulation}
                      </div>
                    </div>
                  ))}
                
                {reviewedIssues.filter(issue => issue.status).length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <FiInfo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No decisions have been made yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
