import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ComplianceReviewPage } from './ComplianceReviewPage';
import { ComplianceDashboard } from './ComplianceDashboard';
import { HistoryDialog } from './HistoryDialog';
import { Document } from '../types/compliance';
import { complianceAPI } from '../services/api';
import { format } from 'date-fns';

// Define proper types for decisions and reviews
interface ReviewIssue {
  id: string;
  clinical_text?: string;
  regulation?: string;
  confidence?: 'high' | 'low';
  status?: string;
}

interface ReviewDecision {
  id: string;
  issueId: string;
  documentTitle: string;
  reviewId: string;
  text: string;
  regulation: string;
  status: string;
  decidedAt: string;
  decidedBy: string;
}

// Define interface for API review result
interface ReviewResult {
  clinical_doc_id: string;
  compliance_doc_id: string;
  issues: ReviewIssue[];
  reviewId?: string; // Optional field that might come from the API
}

// Interface for full review data
interface Review {
  id: string;
  clinical_doc_id?: string;
  compliance_doc_id?: string;
  clinicalDoc?: string;
  complianceDoc?: string;
  issues?: ReviewIssue[];
  created?: string;
  clinical_doc_content?: string;
  compliance_doc_content?: string;
  reviewId?: string;
}

export const ComplianceContainer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Document selection state
  const [selectedClinicalDoc, setSelectedClinicalDoc] = useState<Document | null>(null);
  const [selectedComplianceDoc, setSelectedComplianceDoc] = useState<Document | null>(null);
  
  // Review state
  const [reviewIssues, setReviewIssues] = useState<ReviewIssue[]>([]);
  const [showComplianceReview, setShowComplianceReview] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [isNavigatingToReview, setIsNavigatingToReview] = useState<boolean>(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [reviewDecisions, setReviewDecisions] = useState<ReviewDecision[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Function to handle history button click
  const handleViewHistory = async () => {
    try {
      setLoadingHistory(true);
      // Fetch review decisions from the backend
      const reviews = await complianceAPI.getReviews();
      
      // Transform the reviews data into the format expected by HistoryDialog
      const decisions = reviews.flatMap((review: Review) => {
        // Each review might have multiple issues/decisions
        if (!review.issues || review.issues.length === 0) return [];
        
        return review.issues.map((issue: ReviewIssue) => ({
          id: `${review.id}_${issue.id}`,
          issueId: issue.id,
          documentTitle: review.clinicalDoc || 'Unknown Document',
          reviewId: review.id,
          text: issue.clinical_text || 'No text available',
          regulation: issue.regulation || 'Regulation not specified',
          status: issue.status || 'pending',
          decidedAt: format(new Date(review.created || new Date()), 'MMM dd yyyy, h:mm a'),
          decidedBy: 'Current User'
        }));
      });
      
      setReviewDecisions(decisions);
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('Error fetching review history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Get review ID from URL
  const getReviewIdFromPath = () => {
    const path = location.pathname;
    if (path.startsWith('/compliance/review/')) {
      return path.split('/').pop() || null;
    }
    return null;
  };

  // Handle document selection
  const handleComplianceDocSelect = (doc: Document) => {
    console.log('Selected compliance document:', doc);
    
    // Make sure we're handling the document type correctly
    const docType = typeof doc.type === 'string' ? doc.type.toLowerCase() : doc.type;
    
    if (docType === 'clinical') {
      console.log('Setting selected clinical document:', doc);
      setSelectedClinicalDoc(doc);
    } else if (docType === 'compliance') {
      console.log('Setting selected compliance document:', doc);
      setSelectedComplianceDoc(doc);
    } else {
      console.warn('Unknown document type:', docType);
    }
  };

  // Handle starting a compliance review
  const handleStartReview = async (clinicalDoc: Document, complianceDoc: Document, reviewId?: string) => {
    console.log('Starting/continuing review with:', { clinicalDoc, complianceDoc, reviewId });
    
    if (!clinicalDoc || !complianceDoc) {
      alert('Please select both a clinical document and a compliance document.');
      return;
    }
    
    // Set navigating state immediately to trigger loading UI
    setIsNavigatingToReview(true);
    
    try {
      setLoading(true);
      
      // Store the selected documents
      setSelectedClinicalDoc(clinicalDoc);
      setSelectedComplianceDoc(complianceDoc);
      
      // If we have a reviewId, this is a continuation of an existing review
      if (reviewId) {
        console.log('Continuing existing review:', reviewId);
        
        // Get the complete review with document content from the backend
        try {
          const completeReview = await complianceAPI.getReviewById(reviewId);
          console.log('Loaded complete review with document content:', completeReview);
          
          // Set the review issues
          setReviewIssues(completeReview.issues || []);
          
          // Update the document objects with content from the database
          if (completeReview.clinical_doc_content) {
            clinicalDoc.content = completeReview.clinical_doc_content;
            console.log('Using clinical document content from database');
          }
          
          if (completeReview.compliance_doc_content) {
            complianceDoc.content = completeReview.compliance_doc_content;
            console.log('Using compliance document content from database');
          }
          
          // Show the review page
          setShowComplianceReview(true);
          
          // Navigate to the review route if we're not already there
          if (location.pathname !== `/compliance/review/${reviewId}`) {
            navigate(`/compliance/review/${reviewId}`);
          }
        } catch (reviewError) {
          console.error('Error loading review data:', reviewError);
          // Fall back to just loading issues if the complete review endpoint fails
          try {
            const reviewIssuesData = await complianceAPI.getIssuesByReviewId(reviewId);
            console.log('Loaded issues for existing review (fallback):', reviewIssuesData);
            setReviewIssues(reviewIssuesData || []);
            
            // Show the review page
            setShowComplianceReview(true);
            
            // Navigate to the review route if we're not already there
            if (location.pathname !== `/compliance/review/${reviewId}`) {
              navigate(`/compliance/review/${reviewId}`);
            }
          } catch (issuesError) {
            console.error('Error loading issues for review:', issuesError);
            // Continue even if we can't load issues
            setReviewIssues([]);
            
            // Show the review page
            setShowComplianceReview(true);
            
            // Navigate to the review route if we're not already there
            if (location.pathname !== `/compliance/review/${reviewId}`) {
              navigate(`/compliance/review/${reviewId}`);
            }
          }
        }
      } else {
        // This is a new review, so analyze the documents
        console.log('Starting new compliance analysis');
        const result = await complianceAPI.analyzeCompliance(
          clinicalDoc.id,
          complianceDoc.id
        ) as ReviewResult;  // Type assertion to include reviewId
        
        console.log('Compliance analysis result:', result);
        
        // Use the review ID from the result or generate a temporary one
        const generatedReviewId = result.reviewId || `temp_${Date.now()}`;
        
        if (result.reviewId) {
          // If we have a review ID, fetch the complete review to get document content
          try {
            console.log('Fetching complete review with document content for new analysis');
            const completeReview = await complianceAPI.getReviewById(result.reviewId);
            
            // Update the documents with content from the database
            if (completeReview.clinical_doc_content) {
              clinicalDoc.content = completeReview.clinical_doc_content;
              console.log('Using clinical document content from new review');
            }
            
            if (completeReview.compliance_doc_content) {
              complianceDoc.content = completeReview.compliance_doc_content;
              console.log('Using compliance document content from new review');
            }
          } catch (error) {
            console.error('Error fetching complete review for new analysis:', error);
            // Continue with the issues we already have
          }
        }
        
        // Set the review issues
        setReviewIssues(result.issues || []);
        
        // Show the review page
        setShowComplianceReview(true);
        
        // Navigate to the review page with the generated ID
        navigate(`/compliance/review/${generatedReviewId}`);
      }
    } catch (error) {
      console.error('Error starting compliance review:', error);
      alert('Failed to analyze compliance. Please try again.');
    } finally {
      setLoading(false);
      // Reset navigation state after a short delay to ensure transitions complete
      setTimeout(() => {
        setIsNavigatingToReview(false);
      }, 800);
    }
  };

  // Effect to sync routes with compliance review state and handle URL parameters
  useEffect(() => {
    // Check if we're on a review route
    const reviewId = getReviewIdFromPath();
    const isReviewRoute = location.pathname.startsWith('/compliance/review/');
    
    // If we're on the review route but review isn't showing, load review data
    if (isReviewRoute && !showComplianceReview) {
      if (reviewId) {
        console.log(`Loading review data for ID: ${reviewId} from URL`);
        
        // Load the review data
        const loadReviewData = async () => {
          try {
            setLoading(true);
            const fullReview = await complianceAPI.getReviewById(reviewId);
            
            if (fullReview) {
              console.log('Loaded review data from URL:', fullReview);
              
              // Create document objects with content from the database
              const clinicalDoc: Document = {
                id: fullReview.clinical_doc_id || reviewId.replace('review_', 'clinical_'),
                title: fullReview.clinicalDoc || 'Clinical Document',
                type: 'clinical',
                filename: fullReview.clinicalDoc || '',
                path: '',
                size: 0,
                content: fullReview.clinical_doc_content
              };
              
              const complianceDoc: Document = {
                id: fullReview.compliance_doc_id || reviewId.replace('review_', 'compliance_'),
                title: fullReview.complianceDoc || 'Compliance Document',
                type: 'compliance',
                filename: fullReview.complianceDoc || '',
                path: '',
                size: 0,
                content: fullReview.compliance_doc_content
              };
              
              // Set the selected documents
              setSelectedClinicalDoc(clinicalDoc);
              setSelectedComplianceDoc(complianceDoc);
              
              // Set the review issues
              setReviewIssues(fullReview.issues || []);
              
              // Show the review
              setShowComplianceReview(true);
            } else {
              console.error('No review data found for ID:', reviewId);
              navigate('/compliance');
            }
          } catch (error) {
            console.error('Error loading review data from URL:', error);
            navigate('/compliance');
          } finally {
            setLoading(false);
          }
        };
        
        loadReviewData();
      } else {
        // If we're on a review route without an ID, just show the review UI
        setShowComplianceReview(true);
      }
    }
    // If we're on the main compliance route but review is showing, hide it
    else if (location.pathname === '/compliance' && showComplianceReview) {
      setShowComplianceReview(false);
      setSelectedClinicalDoc(null);
      setSelectedComplianceDoc(null);
      setReviewIssues([]);
    }
  }, [location.pathname, showComplianceReview, navigate]);

  // Check route status
  const isReviewRoute = location.pathname.startsWith('/compliance/review/');
  
  // Debug information for troubleshooting
  console.log('Compliance Content State:', {
    showComplianceReview,
    isReviewRoute,
    selectedClinicalDoc,
    selectedComplianceDoc,
    reviewIssues,
    loading,
    isNavigatingToReview
  });
  
  // If navigating to review or still loading review data, show loading spinner
  if (isNavigatingToReview || (isReviewRoute && loading)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // Show either the review page or the dashboard
  return (
    <>
      {(isReviewRoute || showComplianceReview) ? (
        <ComplianceReviewPage
          clinicalDocument={{
            id: selectedClinicalDoc?.id || '',
            title: selectedClinicalDoc?.title || '',
            content: ''
          }}
          complianceDocument={{
            id: selectedComplianceDoc?.id || '',
            title: selectedComplianceDoc?.title || '',
            content: ''
          }}
          issues={reviewIssues}
          onClose={() => {
            setShowComplianceReview(false);
            setSelectedClinicalDoc(null);
            setSelectedComplianceDoc(null);
            navigate('/compliance', { state: { activeTab: 'reviews' } });
          }}
          onSaveDecisions={async (decisions) => {
            console.log('Saved decisions:', decisions);
            
            try {
              // Create a review record in the backend
              if (selectedClinicalDoc && selectedComplianceDoc) {
                await complianceAPI.createReview({
                  id: `review_${Date.now()}`,
                  clinical_doc_id: selectedClinicalDoc.id,
                  compliance_doc_id: selectedComplianceDoc.id,
                  clinicalDoc: selectedClinicalDoc.title,
                  complianceDoc: selectedComplianceDoc.title,
                  status: 'completed',
                  issues: reviewIssues.length,
                  highConfidenceIssues: reviewIssues.filter(i => i.confidence === 'high').length,
                  lowConfidenceIssues: reviewIssues.filter(i => i.confidence === 'low').length,
                  created: new Date().toISOString()
                });
              }
              
              setShowComplianceReview(false);
              setSelectedClinicalDoc(null);
              setSelectedComplianceDoc(null);
              navigate('/compliance');
              await handleViewHistory(); // Show the history dialog after saving decisions
            } catch (error) {
              console.error('Error saving review decisions:', error);
              alert('Failed to save review decisions. Please try again.');
            }
          }}
        />
      ) : (
        <ComplianceDashboard 
          onDocumentSelect={handleComplianceDocSelect}
          onStartReview={(clinicalDoc, complianceDoc, reviewId) => {
            handleStartReview({
              ...clinicalDoc,
              filename: clinicalDoc.title,
              path: `/documents/${clinicalDoc.id}`,
              size: 0
            }, {
              ...complianceDoc,
              filename: complianceDoc.title,
              path: `/documents/${complianceDoc.id}`,
              size: 0
            }, reviewId);
            // Navigation is done inside handleStartReview
          }}
        />
      )}

      {/* History Dialog */}
      <HistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        decisions={reviewDecisions}
        loading={loadingHistory}
      />
    </>
  );
}; 