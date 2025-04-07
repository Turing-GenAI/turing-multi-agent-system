import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
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
  onSaveDecisions: (decisions: { issueId: string; status: 'accepted' | 'rejected' }[]) => void;
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
  
  // Handle issue decisions (accept/reject)
  const handleDecision = (decision: 'accepted' | 'rejected') => {
    const updatedIssues = [...reviewedIssues];
    updatedIssues[currentIssueIndex] = {
      ...updatedIssues[currentIssueIndex],
      status: decision
    };
    setReviewedIssues(updatedIssues);
  };
  
  // Finalize review and save decisions
  const finalizeReview = () => {
    const decisions = reviewedIssues
      .filter(issue => issue.status)
      .map(issue => ({
        issueId: issue.id,
        status: issue.status as 'accepted' | 'rejected'
      }));
    
    onSaveDecisions(decisions);
  };
  
  // Get the content to display - use fetched content or fallback to props
  const displayClinicalContent = clinicalContent || clinicalDocument.content;
  const displayComplianceContent = complianceContent || complianceDocument.content;
  
  // Highlight non-compliant text in clinical document
  const highlightClinicalText = (content: string) => {
    let highlightedContent = content;
    
    reviewedIssues.forEach(issue => {
      const textToHighlight = issue.clinical_text;
      const confidenceClass = issue.confidence === 'high' ? 'bg-red-200' : 'bg-yellow-200';
      const statusClass = issue.status === 'accepted' ? 'border-green-500' : 
                          issue.status === 'rejected' ? 'border-red-500' : '';
      
      // Replace the text with highlighted version
      // Using a simple replace, but in a real implementation you might need a more sophisticated approach
      // to handle multiple occurrences and HTML content
      highlightedContent = highlightedContent.replace(
        textToHighlight,
        `<span id="issue-${issue.id}" class="${confidenceClass} ${statusClass} px-1 border-b-2">${textToHighlight}</span>`
      );
    });
    
    return highlightedContent;
  };
  
  // Highlight compliance text
  const highlightComplianceText = (content: string, issueIndex: number) => {
    if (!reviewedIssues[issueIndex]) return content;
    
    let highlightedContent = content;
    const textToHighlight = reviewedIssues[issueIndex].compliance_text;
    
    // Replace the text with highlighted version
    highlightedContent = highlightedContent.replace(
      textToHighlight,
      `<span class="bg-blue-100 px-1">${textToHighlight}</span>`
    );
    
    return highlightedContent;
  };
  
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
        <div className="border-r overflow-auto p-6">
          <h3 className="text-lg font-semibold mb-4">{clinicalDocument.title}</h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: highlightClinicalText(displayClinicalContent) 
              }} />
            </div>
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
                    >
                      <FiCheck className="w-4 h-4" />
                      Accept
                    </button>
                    <button 
                      className={`flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50 ${
                        currentIssue.status === 'rejected' ? 'bg-red-50 border-red-300' : ''
                      }`}
                      onClick={() => handleDecision('rejected')}
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
