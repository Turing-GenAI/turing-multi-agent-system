import React, { useState, useRef, useEffect } from 'react';
import { FiChevronRight, FiChevronLeft, FiMaximize, FiMinimize } from 'react-icons/fi';

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

interface DocumentViewerProps {
  document: {
    id: string;
    title: string;
    content: string;
  };
  issues: ComplianceIssue[];
  currentIssueId?: string;
  onIssueSelect?: (issueId: string) => void;
  isComplianceDoc?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  issues,
  currentIssueId,
  onIssueSelect,
  isComplianceDoc = false
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Function to highlight text in the document
  const highlightDocumentText = () => {
    let highlightedContent = document.content;
    
    issues.forEach(issue => {
      const textToHighlight = isComplianceDoc ? issue.compliance_text : issue.clinical_text;
      
      if (!textToHighlight) return;
      
      const confidenceClass = issue.confidence === 'high' ? 'bg-red-200' : 'bg-yellow-200';
      const statusClass = issue.status === 'accepted' ? 'border-green-500' : 
                          issue.status === 'rejected' ? 'border-red-500' : '';
      const isCurrentClass = currentIssueId === issue.id ? 'ring-2 ring-blue-400' : '';
      
      // Replace the text with highlighted version
      highlightedContent = highlightedContent.replace(
        textToHighlight,
        `<span id="issue-${issue.id}" 
          class="${confidenceClass} ${statusClass} ${isCurrentClass} px-1 border-b-2 cursor-pointer" 
          data-issue-id="${issue.id}">
          ${textToHighlight}
        </span>`
      );
    });
    
    return highlightedContent;
  };
  
  // Scroll to the highlighted issue when it changes
  useEffect(() => {
    if (currentIssueId && contentRef.current) {
      const issueElement = contentRef.current.querySelector(`#issue-${currentIssueId}`);
      if (issueElement) {
        issueElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentIssueId]);
  
  // Handle click on highlighted issues
  useEffect(() => {
    const handleIssueClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.hasAttribute('data-issue-id') && onIssueSelect) {
        const issueId = target.getAttribute('data-issue-id');
        if (issueId) {
          onIssueSelect(issueId);
        }
      }
    };
    
    if (contentRef.current) {
      contentRef.current.addEventListener('click', handleIssueClick);
    }
    
    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('click', handleIssueClick);
      }
    };
  }, [onIssueSelect]);
  
  // Find the current issue index
  const currentIssueIndex = issues.findIndex(issue => issue.id === currentIssueId);
  
  // Navigate to next/previous issue
  const navigateIssue = (direction: 'next' | 'prev') => {
    if (!onIssueSelect || issues.length === 0) return;
    
    if (direction === 'next' && currentIssueIndex < issues.length - 1) {
      onIssueSelect(issues[currentIssueIndex + 1].id);
    } else if (direction === 'prev' && currentIssueIndex > 0) {
      onIssueSelect(issues[currentIssueIndex - 1].id);
    }
  };
  
  return (
    <div className={`bg-white ${fullscreen ? 'fixed inset-0 z-50' : 'relative h-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{document.title}</h3>
          
          <div className="flex items-center gap-2">
            {/* Issue navigation */}
            {issues.length > 0 && (
              <div className="flex items-center border rounded overflow-hidden mr-2">
                <button 
                  className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  disabled={currentIssueIndex <= 0}
                  onClick={() => navigateIssue('prev')}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 border-l border-r text-sm">
                  {currentIssueIndex + 1} of {issues.length}
                </div>
                <button 
                  className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  disabled={currentIssueIndex >= issues.length - 1}
                  onClick={() => navigateIssue('next')}
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button 
              className="p-2 rounded hover:bg-gray-100"
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? (
                <FiMinimize className="w-4 h-4" />
              ) : (
                <FiMaximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Document content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-auto p-6"
        >
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: highlightDocumentText() }} />
          </div>
        </div>
        
        {/* Legend for highlights (shown at the bottom) */}
        {issues.length > 0 && (
          <div className="p-3 border-t bg-gray-50 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-red-200"></span>
              <span>High Confidence Issue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-yellow-200"></span>
              <span>Low Confidence Issue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-b-2 border-green-500"></span>
              <span>Accepted Issue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-b-2 border-red-500"></span>
              <span>Rejected Issue</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
