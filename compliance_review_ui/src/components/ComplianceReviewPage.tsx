import React, { useState, useEffect } from 'react';
import { documentAPI, complianceAPI } from '../services/api';
import { FiX, FiCheck, FiExternalLink, FiChevronRight, FiChevronLeft, FiInfo, FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi';

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
  onSaveDecisions: (
    decisions: { issueId: string; status: 'accepted' | 'rejected'; appliedChange?: string | null }[], 
    counts: { totalIssues: number; reviewedIssues: number; highConfidenceIssues: number; lowConfidenceIssues: number },
    reviewStatus: 'in-progress' | 'completed'
  ) => void;
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
  const [contentLoaded, setContentLoaded] = useState<boolean>(false);
  const [appliedChanges, setAppliedChanges] = useState<Map<string, string>>(new Map());
  const [processingEdit, setProcessingEdit] = useState<boolean>(false);
  const [showFinalDocument, setShowFinalDocument] = useState<boolean>(false);
  const [finalDocument, setFinalDocument] = useState<string>('');
  const [savingProgress, setSavingProgress] = useState<boolean>(false);
  const [progressSaved, setProgressSaved] = useState<boolean>(false);
  const [issuesLoaded, setIssuesLoaded] = useState<boolean>(issues.length > 0);
  const [decisionHistory, setDecisionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [reviewId, setReviewId] = useState<string>('');
  
  // No longer needed as we always want to refresh history when the panel is opened
  // const historyLoadedRef = React.useRef(false);
  
  const currentIssue = reviewedIssues[currentIssueIndex] || null;
  
  // Use document content from props or fetch from backend if needed
  useEffect(() => {
    // Skip if we've already loaded content for these documents
    if (contentLoaded) return;
    
    const loadDocumentContent = async () => {
      try {
        setLoading(true);
        
        // First check if we have a review ID and if there's a saved version with edits
        if (reviewId) {
          console.log(`Checking for edited document content for review ID: ${reviewId}`);
          try {
            const reviewData = await complianceAPI.getReviewById(reviewId);
            
            // Check if we have edited clinical document content saved
            if (reviewData.clinical_doc_content) {
              console.log('Found edited document content in the review record');
              setClinicalContent(reviewData.clinical_doc_content);
              
              // Still need to set compliance content (unlikely to have edits)
              if (reviewData.compliance_doc_content) {
                setComplianceContent(reviewData.compliance_doc_content);
              } else if (complianceDocument.content) {
                setComplianceContent(complianceDocument.content);
              } else if (complianceDocument.id) {
                const complianceContentData = await documentAPI.getDocumentContent(complianceDocument.id);
                setComplianceContent(complianceContentData);
              }
              
              setContentLoaded(true);
              return; // Exit early since we found the edited content
            }
          } catch (error) {
            console.warn(`Could not retrieve review data for ${reviewId}:`, error);
            // Continue with regular content loading on error
          }
        }
        
        // Check if content is already provided in props if we couldn't load from review
        if (clinicalDocument.content && complianceDocument.content) {
          console.log('Using document content from props (already in database)');
          setClinicalContent(clinicalDocument.content);
          setComplianceContent(complianceDocument.content);
          setContentLoaded(true);
        } 
        // Only fetch from API if we don't already have content
        else if (clinicalDocument.id && complianceDocument.id) {
          console.log('Content not in props, fetching from API');
          // Fetch clinical document content
          const clinicalContentData = await documentAPI.getDocumentContent(clinicalDocument.id);
          setClinicalContent(clinicalContentData);
          
          // Fetch compliance document content
          const complianceContentData = await documentAPI.getDocumentContent(complianceDocument.id);
          setComplianceContent(complianceContentData);
          
          // Mark content as loaded to prevent refetching
          setContentLoaded(true);
        }
      } catch (err) {
        console.error('Error loading document content:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDocumentContent();
  }, [clinicalDocument.id, clinicalDocument.content, complianceDocument.id, complianceDocument.content, contentLoaded, reviewId]);
  
  // Function to navigate between issues with cyclic navigation
  const navigateIssue = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      // If at the last issue, cycle to the first issue
      if (currentIssueIndex === reviewedIssues.length - 1) {
        setCurrentIssueIndex(0);
      } else {
        setCurrentIssueIndex(currentIssueIndex + 1);
      }
    } else if (direction === 'prev') {
      // If at the first issue, cycle to the last issue
      if (currentIssueIndex === 0) {
        setCurrentIssueIndex(reviewedIssues.length - 1);
      } else {
        setCurrentIssueIndex(currentIssueIndex - 1);
      }
    }
  };
  
  // Function to scroll to the currently selected issue in both documents
  const scrollToCurrentIssue = () => {
    if (currentIssue) {
      setTimeout(() => {
        // Scroll to highlighted text in clinical document
        const issueElement = document.getElementById(`issue-${currentIssue.id}`);
        if (issueElement) {
          issueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a temporary highlight effect
          issueElement.classList.add('ring-2', 'ring-opacity-100');
          setTimeout(() => {
            issueElement.classList.remove('ring-opacity-100');
          }, 1000);
        }
        
        // Scroll to highlighted text in compliance document
        const complianceHighlightedElements = document.querySelectorAll('.bg-blue-200.hover\\:bg-blue-300.text-blue-900');
        
        if (complianceHighlightedElements.length > 0) {
          // Get the first highlighted element - assuming it corresponds to current issue
          const complianceElement = complianceHighlightedElements[0];
          
          // Apply scroll with a slight delay to ensure both scrolls don't conflict
          setTimeout(() => {
            // Get the compliance document container for proper scrolling - specifically the second panel in the grid
            const complianceContainer = document.querySelector('.grid-cols-2 > div:nth-child(2)');
            if (complianceContainer && complianceElement) {
              // Calculate scroll position to center the element in the container
              const containerRect = complianceContainer.getBoundingClientRect();
              const elementRect = complianceElement.getBoundingClientRect();
              const scrollTop = elementRect.top - containerRect.top - (containerRect.height / 2) + complianceContainer.scrollTop;
              
              // Scroll the container
              complianceContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
              
              // Add a temporary highlight effect
              complianceElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-100');
              setTimeout(() => {
                complianceElement.classList.remove('ring-blue-500', 'ring-opacity-100');
              }, 1000);
            }
          }, 600); // Delay slightly longer than clinical text scroll to avoid conflict
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
  
  // Generate a final document with all accepted changes applied
  const generateFinalDocument = (): string => {
    // Start with the original content
    let finalContent = clinicalContent || clinicalDocument.content;
    
    // Get all issues that have been accepted and have applied changes
    const acceptedIssues = reviewedIssues.filter(
      issue => issue.status === 'accepted' && appliedChanges.has(issue.clinical_text)
    );
    
    // Sort issues by their position in the document (to avoid replacing issues out of order)
    const sortedIssues = [...acceptedIssues].sort((a, b) => {
      const posA = finalContent.indexOf(a.clinical_text);
      const posB = finalContent.indexOf(b.clinical_text);
      return posA - posB;
    });
    
    // Apply each change to the content
    for (const issue of sortedIssues) {
      const originalText = issue.clinical_text;
      const revisedText = appliedChanges.get(originalText) || issue.suggested_edit;
      
      try {
        // Normalize whitespace and escape special characters for regex
        const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();
        const normalizedContent = normalizeText(finalContent);
        const normalizedOriginal = normalizeText(originalText);
        
        const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedText = escapeRegExp(normalizedOriginal);
        
        if (normalizedContent.includes(normalizedOriginal)) {
          const flexRegex = new RegExp(escapedText.replace(/\s+/g, '\\s+'), 'g');
          finalContent = finalContent.replace(flexRegex, revisedText);
        }
      } catch (error) {
        console.error('Error applying change to final document:', error);
      }
    }
    
    return finalContent;
  };
  
  // Finalize review and save decisions - used during ongoing review to save progress
  const saveProgress = async () => {
    // Show saving indicator
    setSavingProgress(true);
    
    try {
      // Count high and low confidence issues
      const highConfidenceIssues = reviewedIssues.filter(issue => issue.confidence === 'high').length;
      const lowConfidenceIssues = reviewedIssues.filter(issue => issue.confidence === 'low').length;
      
      // First prepare all decisions including pending ones for our count
      const allDecisions = reviewedIssues.map(issue => ({
        issueId: issue.id,
        status: issue.status || 'pending',
        confidence: issue.confidence,
        appliedChange: issue.status === 'accepted' && appliedChanges.has(issue.clinical_text) 
          ? appliedChanges.get(issue.clinical_text) 
          : undefined
      }));
      
      // Now filter to only include accepted/rejected decisions for the API
      const finalizedDecisions = allDecisions
        .filter(decision => decision.status === 'accepted' || decision.status === 'rejected')
        .map(({ issueId, status, appliedChange }) => ({
          issue_id: issueId, // Use snake_case to match backend expectations
          action: status as 'accepted' | 'rejected',
          applied_change: appliedChange
        }));
      
      // Prepare issue statuses for saving (all issues, not just finalized ones)
      const issueStatuses = reviewedIssues.map(issue => ({
        issue_id: issue.id,
        status: issue.status || 'pending'
      }));
      
      // Generate the current state of the document with all applied changes
      const updatedDocumentContent = generateFinalDocument();
      
      // Save all changes to the database
      if (reviewId) {
        console.log(`Saving changes to database using review ID: ${reviewId}`);
        try {
          // 1. Save the decisions first
          if (finalizedDecisions.length > 0) {
            await complianceAPI.saveDecisions(reviewId, finalizedDecisions);
            console.log('Decisions saved successfully');
          }
          
          // 2. Update all issue statuses (including pending ones)
          // This ensures we know which issues were addressed when reopening
          await complianceAPI.updateIssueStatuses(issueStatuses);
          console.log('Issue statuses updated successfully');
          
          // 3. Update the review with the latest document content
          await complianceAPI.updateReviewContent(reviewId, {
            clinical_doc_content: updatedDocumentContent
          });
          console.log('Updated document content saved successfully');
        } catch (err) {
          console.error('Error saving to the database:', err);
        }
      } else {
        console.error('Cannot save changes: No review ID found');
      }
      
      // We'll no longer call onSaveDecisions here since it's closing the document viewer
      // Instead, we're now directly saving to the database with the proper review ID
      
      // Calculate the counts for logging purposes
      const counts = {
        totalIssues: reviewedIssues.length,
        reviewedIssues: reviewedIssues.filter(issue => issue.status === 'accepted' || issue.status === 'rejected').length,
        highConfidenceIssues,
        lowConfidenceIssues
      };
      
      console.log('Decision counts:', counts);
      
      // Note: We're intentionally NOT calling onSaveDecisions here to prevent the document viewer from closing
      // The onSaveDecisions callback will only be used when finalizing the review, not for saving progress
      
      // Show success message
      setProgressSaved(true);
      setTimeout(() => setProgressSaved(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSavingProgress(false);
    }
  };
  
  // Finalize review function - only shows the finalized document popup
  const finalizeReview = (event?: React.MouseEvent) => {
    // Prevent any default behavior or event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      // Generate the final document with all changes applied
      const finalDocContent = generateFinalDocument();
      setFinalDocument(finalDocContent);
      
      // Show the final document popup
      setShowFinalDocument(true);
    } catch (error) {
      console.error('Error finalizing review:', error);
    }
  };
  
  // Complete the review after user has viewed the final document
  const completeReview = () => {
    try {
      // Count high and low confidence issues
      const highConfidenceIssues = reviewedIssues.filter(issue => issue.confidence === 'high').length;
      const lowConfidenceIssues = reviewedIssues.filter(issue => issue.confidence === 'low').length;
      
      // First prepare all decisions including pending ones for our count
      const allDecisions = reviewedIssues.map(issue => ({
        issueId: issue.id,
        status: issue.status || 'pending',
        confidence: issue.confidence,
        appliedChange: issue.status === 'accepted' && appliedChanges.has(issue.clinical_text) 
          ? appliedChanges.get(issue.clinical_text) 
          : undefined
      }));
      
      // Now filter to only include accepted/rejected decisions for the API
      const finalizedDecisions = allDecisions
        .filter(decision => decision.status === 'accepted' || decision.status === 'rejected')
        .map(({ issueId, status, appliedChange }) => ({
          issueId,
          status: status as 'accepted' | 'rejected',
          appliedChange
        }));
      
      // Close the popup first
      setShowFinalDocument(false);
      
      // Include the issue counts in the saved data - mark as completed
      // Use setTimeout to ensure this doesn't block the UI or cause immediate state changes
      setTimeout(() => {
        onSaveDecisions(finalizedDecisions, {
          totalIssues: reviewedIssues.length,
          reviewedIssues: reviewedIssues.filter(issue => issue.status === 'accepted' || issue.status === 'rejected').length,
          highConfidenceIssues,
          lowConfidenceIssues
        }, 'completed');
      }, 100);
      
      // Don't call onClose() here - let the parent component decide whether to close
    } catch (error) {
      console.error('Error completing review:', error);
    }
  };
  
  // Get the content to display - use modified content when available
  // Use memo to prevent recalculating on every render
  const displayClinicalContent = React.useMemo(() => {
    return clinicalContent || clinicalDocument.content;
  }, [clinicalContent, clinicalDocument.content]);
  
  const displayComplianceContent = React.useMemo(() => {
    return complianceContent || complianceDocument.content;
  }, [complianceContent, complianceDocument.content]);
  
  // Highlight non-compliant text in clinical document - memoized to prevent re-highlighting on every render
  const highlightedClinicalContent = React.useMemo(() => {
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
          const acceptedClass = 'bg-green-200';
          const isCurrentClass = index === currentIssueIndex ? 'ring-2 ring-blue-400' : '';
          
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
                  class="${acceptedClass} ${isCurrentClass} px-1 cursor-pointer" 
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
            ? 'bg-red-200' 
            : 'bg-yellow-200';
          const statusClass = issue.status === 'accepted' 
            ? 'border-green-600 border-b-2' 
            : issue.status === 'rejected' 
              ? 'border-red-600 border-b-2' 
              : 'border-gray-400 border-b-2';
          const isCurrentClass = index === currentIssueIndex ? 'ring-2 ring-blue-400' : '';
          
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
                  class="${confidenceClass} ${statusClass} ${isCurrentClass} px-1 cursor-pointer" 
                  onclick="document.dispatchEvent(new CustomEvent('issueClick', {detail: ${index}}))"
                >
                  $&
                </span>`
              );
              matched = true;
            }
            
            // 2. If exact matching fails, try using word boundary matching
            if (!matched && normalizedTextToHighlight.length > 10) {
              try {
                // Create an array of individual words
                const words = normalizedTextToHighlight.split(' ');
                if (words.length >= 3) {
                  // Create a pattern that matches these words with flexible spacing
                  const wordsPattern = words.map(word => escapeRegExp(word)).join('\\s+');
                  const boundaryRegex = new RegExp(`\\b${wordsPattern}\\b`, 'g');
                  
                  const replaced = highlightedContent.replace(
                    boundaryRegex,
                    (match) => `<span class="bg-blue-200 px-1">${match}</span>`
                  );
                  
                  if (replaced !== highlightedContent) {
                    highlightedContent = replaced;
                    matched = true;
                  }
                }
              } catch (error) {
                console.error('Error with word boundary matching:', error);
              }
            }
            
            // 3. If still not matched, try matching first few words
            if (!matched && normalizedTextToHighlight.length > 10) {
              // For longer strings, try matching initial words (minimum 10 chars)
              const words = normalizedTextToHighlight.split(' ');
              const firstFewWords = words.slice(0, Math.min(5, words.length)).join(' ');
              
              if (firstFewWords.length >= 10) {
                const partialRegex = new RegExp(escapeRegExp(firstFewWords) + '[\\s\\S]{0,50}', 'g');
                
                const replaced = highlightedContent.replace(
                  partialRegex,
                  (match) => `<span class="bg-blue-200 px-1">${match}</span>`
                );
                
                if (replaced !== highlightedContent) {
                  highlightedContent = replaced;
                  matched = true;
                }
              }
            }
            
            // 4. As a last resort, try an even looser matching approach for long texts
            if (!matched && normalizedTextToHighlight.length > 30) {
              // Find a significant initial portion and search for it
              const initialPortion = normalizedTextToHighlight.substring(0, 30);
              
              const textIndex = normalizedContent.indexOf(initialPortion);
              if (textIndex >= 0) {
                // Find a natural stopping point - near the expected end or at the next punctuation
                const expectedLength = normalizedTextToHighlight.length;
                const maxEnd = Math.min(textIndex + expectedLength + 20, normalizedContent.length);
                
                let endIndex = maxEnd;
                for (let i = textIndex + expectedLength - 10; i < maxEnd; i++) {
                  if (i >= normalizedContent.length) break;
                  if ('.!?;:'.includes(normalizedContent[i])) {
                    endIndex = i + 1;
                    break;
                  }
                }
                
                // Extract the matched section and highlight it
                const originalStart = content.indexOf(content.substring(textIndex, textIndex + 20));
                if (originalStart >= 0) {
                  const textToMatch = content.substring(originalStart, originalStart + (endIndex - textIndex));
                  
                  // Create a safe regex for this specific text
                  const safeRegex = new RegExp(escapeRegExp(textToMatch), 'g');
                  
                  const replaced = highlightedContent.replace(
                    safeRegex,
                    (match) => `<span class="bg-blue-200 px-1">${match}</span>`
                  );
                  
                  if (replaced !== highlightedContent) {
                    highlightedContent = replaced;
                    matched = true;
                  }
                }
              }
            }
            
            // 5. Log if no match was found for debugging
            if (!matched) {
              console.warn(`Could not find text match for issue: "${normalizedTextToHighlight.substring(0, 50)}..."`);
            }
          } catch (error) {
            console.error('Error highlighting clinical text:', error);
          }
        }
      });
      
      return highlightedContent;
    }
    
    return highlightClinicalText(displayClinicalContent);
  }, [displayClinicalContent, reviewedIssues, currentIssueIndex, appliedChanges]);
  
  // Highlight compliance text with improved styling - memoized to prevent re-highlighting on every render
  const highlightedComplianceContent = React.useMemo(() => {
    // Helper function to highlight compliance text
    function highlightComplianceText(content: string, issueIndex: number) {
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
            `<span class="bg-blue-200 px-1">$&</span>`
          );
          matched = true;
        }
        
        // 2. If exact matching fails, try using word boundary matching
        if (!matched && normalizedTextToHighlight.length > 10) {
          try {
            // Create an array of individual words
            const words = normalizedTextToHighlight.split(' ');
            if (words.length >= 3) {
              // Create a pattern that matches these words with flexible spacing
              const wordsPattern = words.map(word => escapeRegExp(word)).join('\\s+');
              const boundaryRegex = new RegExp(`\\b${wordsPattern}\\b`, 'g');
              
              const replaced = highlightedContent.replace(
                boundaryRegex,
                (match) => `<span class="bg-blue-200 px-1">${match}</span>`
              );
              
              if (replaced !== highlightedContent) {
                highlightedContent = replaced;
                matched = true;
              }
            }
          } catch (error) {
            console.error('Error with word boundary matching:', error);
          }
        }
        
        // 3. If still not matched, try matching first few words
        if (!matched && normalizedTextToHighlight.length > 10) {
          // For longer strings, try matching initial words (minimum 10 chars)
          const words = normalizedTextToHighlight.split(' ');
          const firstFewWords = words.slice(0, Math.min(5, words.length)).join(' ');
          
          if (firstFewWords.length >= 10) {
            const partialRegex = new RegExp(escapeRegExp(firstFewWords) + '[\\s\\S]{0,50}', 'g');
            
            const replaced = highlightedContent.replace(
              partialRegex,
              (match) => `<span class="bg-blue-200 px-1">${match}</span>`
            );
            
            if (replaced !== highlightedContent) {
              highlightedContent = replaced;
              matched = true;
            }
          }
        }
        
        // 4. As a last resort, try an even looser matching approach for long texts
        if (!matched && normalizedTextToHighlight.length > 30) {
          // Find a significant initial portion and search for it
          const initialPortion = normalizedTextToHighlight.substring(0, 30);
          
          const textIndex = normalizedContent.indexOf(initialPortion);
          if (textIndex >= 0) {
            // Find a natural stopping point - near the expected end or at the next punctuation
            const expectedLength = normalizedTextToHighlight.length;
            const maxEnd = Math.min(textIndex + expectedLength + 20, normalizedContent.length);
            
            let endIndex = maxEnd;
            for (let i = textIndex + expectedLength - 10; i < maxEnd; i++) {
              if (i >= normalizedContent.length) break;
              if ('.!?;:'.includes(normalizedContent[i])) {
                endIndex = i + 1;
                break;
              }
            }
            
            // Extract the matched section and highlight it
            const originalStart = content.indexOf(content.substring(textIndex, textIndex + 20));
            if (originalStart >= 0) {
              const textToMatch = content.substring(originalStart, originalStart + (endIndex - textIndex));
              
              // Create a safe regex for this specific text
              const safeRegex = new RegExp(escapeRegExp(textToMatch), 'g');
              
              const replaced = highlightedContent.replace(
                safeRegex,
                (match) => `<span class="bg-blue-200 px-1">${match}</span>`
              );
              
              if (replaced !== highlightedContent) {
                highlightedContent = replaced;
                matched = true;
              }
            }
          }
        }
        
        // 5. Log if no match was found for debugging
        if (!matched) {
          console.warn(`Could not find compliance text match: "${normalizedTextToHighlight.substring(0, 50)}..."`);
        }
      } catch (error) {
        console.error('Error highlighting compliance text:', error);
      }
      
      return highlightedContent;
    }
    
    return highlightComplianceText(displayComplianceContent, currentIssueIndex);
  }, [displayComplianceContent, currentIssue, currentIssueIndex, reviewedIssues]);
  
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
  
  useEffect(() => {
    // Update the issues loaded state whenever reviewedIssues changes
    setIssuesLoaded(reviewedIssues.length > 0);
  }, [reviewedIssues]);

  // Find review ID by clinical document ID on initial load
  useEffect(() => {
    const findReviewId = async () => {
      if (clinicalDocument.id) {
        try {
          const reviews = await complianceAPI.getReviews();
          const matchingReview = reviews.find(r => r.clinical_doc_id === clinicalDocument.id);
          if (matchingReview && matchingReview.id) {
            console.log(`Found review ID ${matchingReview.id} for document ${clinicalDocument.id}`);
            setReviewId(matchingReview.id);
          } else {
            console.warn(`Could not find review ID for document ${clinicalDocument.id}`);
          }
        } catch (error) {
          console.error('Error finding review ID:', error);
        }
      }
    };
    
    findReviewId();
  }, [clinicalDocument.id]);
  
  // Load saved issue statuses and applied changes when review ID is available
  useEffect(() => {
    if (!reviewId) return;
    
    const loadSavedIssueData = async () => {
      try {
        console.log(`Loading saved issue data for review ID: ${reviewId}`);
        
        // Get decision history to find applied changes
        const decisions = await complianceAPI.getReviewDecisions(reviewId);
        if (decisions && decisions.length > 0) {
          console.log(`Found ${decisions.length} saved decisions`); 
          
          // Create a map to store the status of each issue
          const issueStatusMap = new Map();
          
          // Create a map for applied changes
          const savedAppliedChanges = new Map();
          
          // Process each decision to extract status and applied changes
          decisions.forEach(item => {
            // Store the status for each issue
            if (item.issue && item.issue.id && item.decision.action) {
              issueStatusMap.set(item.issue.id, item.decision.action);
              
              // If this is an accepted decision with an applied change, store it
              if (item.decision.action === 'accepted' && 
                  item.decision.applied_change && 
                  item.issue.clinical_text) {
                savedAppliedChanges.set(item.issue.clinical_text, item.decision.applied_change);
                console.log(`Found applied change for issue ${item.issue.id}: ${item.decision.applied_change.substring(0, 30)}...`);
              }
            }
          });
          
          // Update the reviewed issues with their status
          if (issueStatusMap.size > 0) {
            const updatedIssues = reviewedIssues.map(issue => {
              if (issueStatusMap.has(issue.id)) {
                return { ...issue, status: issueStatusMap.get(issue.id) };
              }
              return issue;
            });
            
            console.log(`Updated ${issueStatusMap.size} issue statuses`);
            setReviewedIssues(updatedIssues);
          }
          
          // Update the appliedChanges map
          if (savedAppliedChanges.size > 0) {
            console.log(`Loaded ${savedAppliedChanges.size} applied changes`);
            setAppliedChanges(savedAppliedChanges);
          }
        }
      } catch (error) {
        console.error('Error loading saved issue data:', error);
      }
    };
    
    loadSavedIssueData();
  }, [reviewId]);
  
  // Load decision history from API when history panel is opened
  useEffect(() => {
    if (showHistory && reviewId) {
      const fetchDecisionHistory = async () => {
        setLoadingHistory(true);
        try {
          console.log(`Fetching decision history for review ${reviewId}`);
          const history = await complianceAPI.getReviewDecisions(reviewId);
          
          // Deduplicate history to show only latest decision per issue
          const issueMap = new Map();
          
          // Process decisions in reverse timestamp order (newest first)
          // This ensures we get the most recent decision for each issue
          const sortedHistory = [...history].sort((a, b) => {
            const dateA = new Date(a.decision.timestamp || 0).getTime();
            const dateB = new Date(b.decision.timestamp || 0).getTime();
            return dateB - dateA; // Descending order (newest first)
          });
          
          // Keep only the newest decision for each issue
          sortedHistory.forEach(item => {
            if (item.issue && item.issue.id) {
              // Only add if we haven't seen this issue before
              if (!issueMap.has(item.issue.id)) {
                issueMap.set(item.issue.id, item);
              }
            }
          });
          
          // Convert map back to array
          const deduplicatedHistory = Array.from(issueMap.values());
          console.log(`Deduplicated history from ${history.length} to ${deduplicatedHistory.length} items`);
          
          // Set the deduplicated history
          setDecisionHistory(deduplicatedHistory);
          
          // Also update the appliedChanges map with any stored changes
          // We create a new Map instead of mutating the existing one
          const newAppliedChanges = new Map();
          deduplicatedHistory.forEach(item => {
            if (item.decision.action === 'accepted' && item.decision.applied_change && item.issue.clinical_text) {
              newAppliedChanges.set(item.issue.clinical_text, item.decision.applied_change);
            }
          });
          
          // Only update if we have changes to apply
          if (newAppliedChanges.size > 0) {
            setAppliedChanges(prev => {
              // Create a new map that combines previous and new changes
              const combined = new Map(prev);
              newAppliedChanges.forEach((value, key) => {
                combined.set(key, value);
              });
              return combined;
            });
          }
        } catch (error) {
          console.error('Error fetching decision history:', error);
        } finally {
          setLoadingHistory(false);
        }
      };
      
      fetchDecisionHistory();
    }
  }, [showHistory, reviewId]); // Always fetch when showHistory changes
  
  return (
    <div className="flex-1 bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Compliance Review</h2>
          <span className="text-sm text-gray-500">#{clinicalDocument.id}</span>
        </div>
        <div className="flex items-center gap-3">
          {progressSaved && (
            <span className="text-sm text-green-600 flex items-center bg-green-50 px-2 py-1 rounded border border-green-200">
              <FiCheck className="w-3 h-3 mr-1" /> Progress saved
            </span>
          )}
          <button 
            onClick={() => {
              // Toggle history view and ensure we refetch the latest data
              setShowHistory(!showHistory);
            }}
            className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
          <button 
            onClick={saveProgress}
            disabled={savingProgress}
            className={`px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 ${
              savingProgress ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {savingProgress ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-700 mr-2"></div>
                Saving...
              </span>
            ) : (
              'Save Progress'
            )}
          </button>
          <button 
            onClick={finalizeReview}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Finalize Review
          </button>
          <button onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-2 h-[calc(100vh-64px)]">
        {/* Clinical Document Content with Highlights */}
        <div className="border-r overflow-auto p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4">{clinicalDocument.title}</h3>
          {loading && clinicalContent === '' ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="prose max-w-none flex-grow">
              <div dangerouslySetInnerHTML={{ 
                __html: highlightedClinicalContent
              }} />
            </div>
              
              {/* Legend for highlighting */}
              {reviewedIssues.length > 0 && (
                <div className="mt-6 p-3 border-t bg-gray-50 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-red-200 rounded-sm"></span>
                    <span>High Confidence Issue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-yellow-200 rounded-sm"></span>
                    <span>Low Confidence Issue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-green-200 rounded-sm"></span>
                    <span>Accepted Change</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border-b-2 border-red-600"></span>
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
          {!showHistory && issuesLoaded ? (
            <div className="sticky top-0 bg-white border-b z-10 p-4 flex items-center justify-between">
              <button 
                onClick={() => navigateIssue('prev')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FiChevronLeft />
              </button>
              <span>Issue {currentIssueIndex + 1} of {reviewedIssues.length}</span>
              <button 
                onClick={() => navigateIssue('next')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FiChevronRight />
              </button>
            </div>
          ) : null}
          
          {!showHistory && loading && reviewedIssues.length > 0 && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Analyzing documents and generating issues...</p>
            </div>
          )}
          
          {!showHistory && (
            <div className="p-6">
              {reviewedIssues.length === 0 ? (
                <div className="bg-green-50 rounded-lg p-6 mb-6 text-center">
                  <div className="flex justify-center mb-3">
                    <FiCheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">No Compliance Issues Found</h3>
                  <p className="text-green-700 mb-4">
                    Great news! The clinical document appears to comply with all regulations in the compliance document.
                  </p>
                  <div className="text-sm text-green-600 bg-green-100 p-3 rounded inline-block">
                    This document pair has passed compliance review.
                  </div>
                </div>
              ) : currentIssue ? (
                <>
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
                            currentIssue.status === 'accepted' ? 'bg-green-50 border-green-300 text-green-700' : ''
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
                          <FiCheck className="w-4 h-4 text-green-600" />
                          Accept
                            </>
                          )}
                        </button>
                        <button 
                          className={`flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50 ${
                            currentIssue.status === 'rejected' ? 'bg-red-50 border-red-300 text-red-700' : ''
                          }`}
                          onClick={() => handleDecision('rejected')}
                          disabled={processingEdit}
                        >
                          <FiX className="w-4 h-4 text-red-600" />
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
                </>
              ) : !loading && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-center py-4 text-gray-500">
                    <FiInfo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No compliance issues found in this document.</p>
                  </div>
                </div>
              )}

              {/* Compliance document - always shown */}
              <div className="mt-6">
                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <span>Compliance Document</span>
                  <FiExternalLink className="w-4 h-4 text-gray-500" />
                </h5>
                <div className="bg-white p-4 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{complianceDocument.title}</span>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div 
                      className="text-sm prose max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightedComplianceContent
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
              
              {loadingHistory ? (
                <div className="flex justify-center my-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {decisionHistory.length > 0 ? (
                    decisionHistory.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Decision on Issue #{index + 1}</h4>
                            <p className="text-xs text-gray-500">{item.decision.timestamp}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.decision.action === 'accepted' ? (
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
                        
                        {/* Issue details */}
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Original Text:</p>
                          <p className="text-sm bg-gray-100 p-2 rounded">{item.issue.clinical_text}</p>
                        </div>
                        
                        {/* Show applied changes if the decision was accepted */}
                        {item.decision.action === 'accepted' && item.decision.applied_change && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Applied Change:</p>
                            <p className="text-sm bg-green-50 p-2 rounded border border-green-100">{item.decision.applied_change}</p>
                          </div>
                        )}
                        
                        {item.issue.regulation && (
                          <div className="mt-2 text-xs text-gray-500">
                            Regulation: {item.issue.regulation}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <FiInfo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No decisions have been saved yet</p>
                      <p className="text-sm mt-2">Make changes and click "Save Progress" to record your decisions</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Final Document Popup */}
      {showFinalDocument && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-3/4 h-3/4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Finalized Document</h3>
              <div className="flex items-center gap-3">
                <button 
                  className="px-3 py-1 flex items-center gap-1 text-sm bg-black text-white rounded hover:bg-gray-800"
                  onClick={completeReview}
                >
                  <FiCheck className="w-4 h-4" />
                  Complete Review
                </button>
                <button 
                  className="px-3 py-1 flex items-center gap-1 text-sm bg-black text-white rounded hover:bg-gray-800"
                  onClick={() => {
                    // Create a blob and download link
                    const blob = new Blob([finalDocument], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${clinicalDocument.title.replace(/\s+/g, '_')}_compliant.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <FiDownload className="w-4 h-4" />
                  Download
                </button>
                <button 
                  onClick={() => setShowFinalDocument(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <h4 className="text-lg font-medium mb-4">{clinicalDocument.title} (Edited)</h4>
              <div className="prose max-w-none whitespace-pre-wrap">
                {finalDocument}
              </div>
            </div>
            
            <div className="border-t p-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Summary:</span> {reviewedIssues.filter(i => i.status === 'accepted').length} changes applied, 
                {reviewedIssues.filter(i => i.status === 'rejected').length} issues rejected,
                {reviewedIssues.filter(i => !i.status || i.status === 'pending').length} issues pending
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
