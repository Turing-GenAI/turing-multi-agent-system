import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { documentAPI, complianceAPI } from '../services/api';
import { FiFileText, FiCheck, FiAlertTriangle, FiTrash2, FiEye, FiPlay, FiSearch } from 'react-icons/fi';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { ToastContainer, ToastType } from './Toast';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ReviewInfo, ReviewAlertRequest } from '../types';
import { EmailAlertModal } from './EmailAlertModal';

// Add global type declaration for window.globalIsAnalyzing
declare global {
  interface Window {
    globalIsAnalyzing: boolean;
  }
}

// Access window.globalIsAnalyzing with proper typing
const getGlobalAnalyzing = () => window.globalIsAnalyzing || false;
const setGlobalAnalyzing = (value: boolean) => { window.globalIsAnalyzing = value; };

interface DocumentInfo {
  id: string;
  title: string;
  type: "clinical" | "compliance";
  filename: string;
  path: string;
  size: number;
  format: string;
  created: string;
  updated: string;
  content?: string;
}

interface ComplianceDashboardProps {
  onDocumentSelect: (doc: DocumentInfo) => void;
  onStartReview: (clinicalDoc: DocumentInfo, complianceDoc: DocumentInfo, reviewId?: string) => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ 
  onDocumentSelect,
  onStartReview
}) => {
  const location = useLocation();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedClinicalDoc, setSelectedClinicalDoc] = useState<DocumentInfo | null>(null);
  // We'll keep this state but won't expose it in the UI
  const [selectedComplianceDoc, setSelectedComplianceDoc] = useState<DocumentInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'reviews'>(
    location.state?.activeTab === 'reviews' ? 'reviews' : 'documents'
  );
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [success, setSuccess] = useState<string | null>(null);
  // Define isAnalyzing state BEFORE any useEffect that depends on it
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Track reviews with processing status to update individually
  const [processingReviews, setProcessingReviews] = useState<{[key: string]: boolean}>({});
  // Change from boolean to string to track which review is being loaded
  const [loadingReviewId, setLoadingReviewId] = useState<string | null>(null);
  // Reviews will use backend-generated UUIDs

  // State for reviews data and loading state
  const [reviews, setReviews] = useState<ReviewInfo[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  
  // Track reviews that are being deleted
  const [reviewsBeingDeleted, setReviewsBeingDeleted] = useState<string[]>([]);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewInfo | null>(null);
  
  // State for email functionality
  const [emailSubject, setEmailSubject] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [emailContent, setEmailContent] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [emailAddresses, setEmailAddresses] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingEmailContent, setIsLoadingEmailContent] = useState<boolean>(false);

  // Replace inline messages with toast system
  const [toasts, setToasts] = useState<Array<{id: string; message: string; type: ToastType}>>([]);
  
  // Function to add a toast
  const addToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  
  // Function to remove a toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Track if window has focus
  const [hasFocus, setHasFocus] = useState(true);

  // Effect to track window focus and refresh when returning
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window regained focus - updating reviews');
      setHasFocus(true);
      if (activeTab === 'reviews') {
        fetchAllReviews();
      }
    };
    
    const handleBlur = () => {
      setHasFocus(false);
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeTab]);

  // Effect to sync with global state on component mount
  useEffect(() => {
    setIsAnalyzing(getGlobalAnalyzing());
  }, []);

  // Effect to refresh reviews when tab becomes active
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    // Function to check for tab visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTab === 'reviews') {
        console.log('Tab became visible - refreshing reviews');
        fetchAllReviews();
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up interval to periodically refresh reviews when on reviews tab
    if (activeTab === 'reviews') {
      intervalId = setInterval(() => {
        fetchAllReviews();
      }, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);

  // Sync local isAnalyzing state with global state
  useEffect(() => {
    // When component mounts or becomes visible, check global state
    if (getGlobalAnalyzing() !== isAnalyzing) {
      setIsAnalyzing(getGlobalAnalyzing());
    }
    
    // Set up an interval to check for global state changes
    const syncInterval = setInterval(() => {
      if (getGlobalAnalyzing() !== isAnalyzing) {
        setIsAnalyzing(getGlobalAnalyzing());
      }
    }, 1000);
    
    return () => clearInterval(syncInterval);
  }, [isAnalyzing]);

  // Fetch documents from the backend API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const docs = await documentAPI.getDocuments();
        console.log('Fetched documents:', docs);
        
        // Ensure document types are properly formatted
        const formattedDocs = docs.map((doc: DocumentInfo) => ({
          ...doc,
          type: String(doc.type).toLowerCase() as 'clinical' | 'compliance'
        }));
        
        setDocuments(formattedDocs);
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        addToast('Failed to load documents. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);

  // Initial fetch to load all reviews - only called when tab changes or component mounts
  const fetchAllReviews = async () => {
    try {
      setLoadingReviews(true);
      const reviewsData = await complianceAPI.getReviews();
      setReviews(reviewsData || []);
      
      // Track which reviews are in processing state
      const processing: { [key: string]: boolean } = {};
      reviewsData.forEach((review: ReviewInfo) => {
        if (review.status === 'processing') {
          processing[review.id] = true;
        }
      });
      setProcessingReviews(processing);
    } catch (err) {
      console.error('Error fetching all reviews:', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };
  
  // Set up polling only for processing reviews - much more efficient
  useEffect(() => {
    if (activeTab === 'reviews' && Object.keys(processingReviews).length > 0) {
      const statusCheckInterval = setInterval(() => {
        checkProcessingReviews();
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(statusCheckInterval);
    }
  }, [activeTab, processingReviews]);

  // Function to check status of individual processing reviews
  const checkProcessingReviews = async () => {
    const processingIds = Object.keys(processingReviews);
    
    if (processingIds.length === 0) return;
    
    try {
      const updatedReviews = await complianceAPI.getReviews();
      let hasStatusChanges = false;
      
      // Create a local copy of current reviews to update
      const updatedReviewsList = [...reviews];
      
      // Check each processing review
      processingIds.forEach(reviewId => {
        const updatedReview = updatedReviews.find((r: ReviewInfo) => r.id === reviewId);
        const existingReviewIndex = updatedReviewsList.findIndex(r => r.id === reviewId);
        
        if (updatedReview) {
          if (existingReviewIndex >= 0) {
            // Update existing review with new status
            updatedReviewsList[existingReviewIndex] = updatedReview;
          } else {
            // Add new review if it doesn't exist in our list
            updatedReviewsList.push(updatedReview);
          }
          
          // Mark that status has changed for this review
          if (processingReviews[reviewId] && updatedReview.status === 'completed') {
            hasStatusChanges = true;
          }
        }
      });
      
      // Update reviews state with all changes
      if (updatedReviewsList.length !== reviews.length || hasStatusChanges) {
        console.log('Updating reviews with latest status changes', updatedReviewsList);
        setReviews(updatedReviewsList);
      }
      
      // Remove completed reviews from processing state
      if (hasStatusChanges) {
        setProcessingReviews(prev => {
          const updated = {...prev};
          updatedReviews.forEach((review: ReviewInfo) => {
            if (updated[review.id] && review.status === 'completed') {
              delete updated[review.id];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error checking processing reviews:', err);
    }
  };

  // Fetch reviews initial load and track processing reviews
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchAllReviews();
    }
  }, [activeTab]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDocumentSelect = (doc: DocumentInfo) => {
    console.log('Selected document:', doc);
    // Always convert to lowercase string for consistent comparison
    const docType = typeof doc.type === 'string' ? doc.type.toLowerCase() : String(doc.type).toLowerCase();
    console.log('Document type:', docType);
    
    // Force refresh UI to ensure selection is visible
    const forceRefresh = () => setTimeout(() => {
      console.log('Forcing UI refresh');
      setDocuments([...documents]); // Create new array reference to trigger re-render
    }, 10);
    
    if (docType === 'clinical') {
      console.log('Setting as clinical document');
      // Toggle selection if clicking on already selected doc
      if (selectedClinicalDoc && selectedClinicalDoc.id === doc.id) {
        setSelectedClinicalDoc(null);
      } else {
        setSelectedClinicalDoc({...doc, type: 'clinical'});
      }
      forceRefresh();
    } else if (docType === 'compliance') {
      console.log('Setting as compliance document');
      // Toggle selection if clicking on already selected doc
      if (selectedComplianceDoc && selectedComplianceDoc.id === doc.id) {
        setSelectedComplianceDoc(null);
      } else {
        setSelectedComplianceDoc({...doc, type: 'compliance'});
      }
      forceRefresh();
    } else {
      console.warn('Unknown document type:', docType, 'for document:', doc);
    }
    
    onDocumentSelect({...doc, type: docType as 'clinical' | 'compliance'}); // Ensure consistent type in callback
  };

  const handleStartReview = async () => {
    if (selectedClinicalDoc) {
      try {
        setIsAnalyzing(true);
        // Update global variable
        setGlobalAnalyzing(true);
        
        // Switch to the Reviews tab first to show analysis progress
        setActiveTab('reviews');
        
        // No need to create a placeholder review - we'll create the final review once we have the analysis results
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        
        // Call the backend API to analyze compliance and auto-select compliance document
        // We only need to pass the clinical doc ID
        const complianceResult = await complianceAPI.analyzeCompliance(
          selectedClinicalDoc.id
        );
        
        // Get the selected compliance document ID from the result
        const selectedComplianceDocId = complianceResult.compliance_doc_id;
        
        // Count high and low confidence issues
        const highConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'high').length;
        const lowConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'low').length;
        
        // Get the compliance document details for the UI
        // Find the doc by ID in the list of documents
        const selectedComplianceDoc = documents.find(doc => 
          doc.id === selectedComplianceDocId && doc.type.toLowerCase() === 'compliance'
        );
        
        // Now create a review with completed status
        await complianceAPI.createReview({
          id: 'will-be-replaced-by-backend', // Backend will generate a sequential ID
          clinical_doc_id: selectedClinicalDoc.id,
          compliance_doc_id: selectedComplianceDocId,
          clinicalDoc: selectedClinicalDoc.title,
          complianceDoc: selectedComplianceDoc ? selectedComplianceDoc.title : "Compliance Document",
          status: 'completed', // Mark as completed
          issues: complianceResult.issues.length,
          highConfidenceIssues,
          lowConfidenceIssues,
          created: formattedDate
        });
        
        // Refresh the reviews list to show the completed review
        await fetchAllReviews();
        
        // Use appropriate toast type based on whether issues were found
        if (complianceResult.issues.length === 0) {
          // No issues found - success message with green
          addToast('Analysis complete. No compliance issues found!', 'success');
        } else {
          // Issues found - warning message with amber
          addToast(`Analysis complete. ${complianceResult.issues.length} compliance issue(s) found.`, 'warning');
        }
      } catch (error) {
        console.error('Error analyzing compliance:', error);
        // Error message with red
        addToast('Failed to analyze compliance. Please try again.', 'error');
      } finally {
        // Finally, set analyzing to false
        setIsAnalyzing(false);
        // Update global variable
        setGlobalAnalyzing(false);

        // Clear selections and stay on reviews tab
        setSelectedDocs([]); // Using the correct state setter
        setSelectedClinicalDoc(null);
        setSelectedComplianceDoc(null);
      }
    }
  };

  // Handle continuing an existing review - this explicitly opens the document viewer
  const handleContinueReview = async (review: ReviewInfo) => {
    try {
      // Store the current isAnalyzing state to restore it when returning
      const wasAnalyzing = isAnalyzing;
      
      // Set the specific review ID that's loading
      setLoadingReviewId(review.id);
      console.log('Continuing review:', review);
      
      // Get the complete review with document content included
      console.log('Fetching complete review with document content from database');
      const fullReview = await complianceAPI.getReviewById(review.id);
      console.log('Retrieved review data with document content:', fullReview);
      
      // Create document objects with content from the database
      const clinicalDoc: DocumentInfo = {
        id: fullReview.clinical_doc_id || review.id.replace('review_', 'clinical_'),
        title: fullReview.clinicalDoc,
        type: 'clinical',
        filename: '',
        path: '',
        size: 0,
        format: 'pdf', // Default format
        created: fullReview.created || new Date().toISOString(),
        updated: fullReview.created || new Date().toISOString(),
        content: fullReview.clinical_doc_content // Use content directly from the database
      };
      
      const complianceDoc: DocumentInfo = {
        id: fullReview.compliance_doc_id || review.id.replace('review_', 'compliance_'),
        title: fullReview.complianceDoc,
        type: 'compliance',
        filename: '',
        path: '',
        size: 0,
        format: 'pdf', // Default format
        created: fullReview.created || new Date().toISOString(),
        updated: fullReview.created || new Date().toISOString(),
        content: fullReview.compliance_doc_content // Use content directly from the database
      };
      
      console.log('Using document content from database - no need to fetch separately');
      
      // The issues are already included in the fullReview response,
      // but we'll keep this for backward compatibility
      try {
        if (fullReview.issues) {
          console.log(`Found ${fullReview.issues.length || 0} issues in the review data`);
        } else {
          // Fallback to separate API call if needed
          const issuesResponse = await complianceAPI.getIssuesByReviewId(review.id);
          console.log(`Found ${issuesResponse?.length || 0} issues for review ${review.id}`);
        }
      } catch (issuesError) {
        console.log('Error with issues data, but continuing to the review page:', issuesError);
        // We'll still navigate to the review page even if we can't fetch issues
      }
      
      // Set the selected documents
      setSelectedClinicalDoc(clinicalDoc);
      setSelectedComplianceDoc(complianceDoc);
      
      // Now that we have all the data including document content, navigate to the document viewer
      onStartReview(clinicalDoc, complianceDoc, review.id);
      
      // Restore the isAnalyzing state after a small delay to ensure it's set after navigation
      setTimeout(() => {
        setGlobalAnalyzing(wasAnalyzing);
      }, 100);
      
    } catch (error) {
      console.error('Error continuing review:', error);
      addToast('Failed to continue review. Please try again.', 'error');
    } finally {
      // Clear the loading state
      setLoadingReviewId(null);
    }
  };

  // Handle deleting a review - opens the confirmation dialog
  const handleDeleteReview = (review: ReviewInfo) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  // Handle actual deletion after confirmation
  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      // Set loading state for this specific review
      const reviewId = reviewToDelete.id;
      setReviewsBeingDeleted(prev => [...prev, reviewId]);
      
      console.log('Deleting review:', reviewId);
      
      // Call the delete API endpoint
      await complianceAPI.deleteReview(reviewId);
      
      // Remove the deleted review from the local state
      setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));
      
      // Show success toast
      addToast('Review deleted successfully.', 'success');
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      addToast('Failed to delete review. Please try again.', 'error');
    } finally {
      // Remove from loading state
      setReviewsBeingDeleted(prev => prev.filter(id => id !== reviewToDelete.id));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setSelectedDocs(
      checked
        ? [...selectedDocs, docId]
        : selectedDocs.filter(id => id !== docId)
    );
  };

  // Alert modal state
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [selectedReviewForAlert, setSelectedReviewForAlert] = useState<ReviewInfo | null>(null);

  // Function to open alert modal
  const handleOpenAlertModal = (review: ReviewInfo) => {
    setSelectedReviewForAlert(review);
    setEmailSubject(`Compliance Review Alert - ${review.clinicalDoc}`);
    setShowAlertModal(true);
    generateEmailContent(review);
  };

  // Handle alert success
  const handleAlertSuccess = (message: string) => {
    addToast(message, 'success');
    setShowAlertModal(false);
    setSelectedReviewForAlert(null);
  };

  // Handle alert error
  const handleAlertError = (message: string) => {
    addToast(message, 'error');
  };

  // Search functionality
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState<string>('');
  const [clinicalDocSearchQuery, setclinicalDocSearchQuery] = useState<string>('');
  
  // Filter documents based on search queries
  const filteredClinicalDocs = documents
    .filter(doc => doc.type.toLowerCase() === 'clinical')
    .filter(doc => 
      doc.title.toLowerCase().includes(clinicalDocSearchQuery.toLowerCase())
    );
    
  // Filter reviews based on search query
  const filteredReviews = reviews.filter(review => 
    review.id.toLowerCase().includes(reviewsSearchQuery.toLowerCase()) ||
    review.clinicalDoc.toLowerCase().includes(reviewsSearchQuery.toLowerCase()) ||
    review.complianceDoc.toLowerCase().includes(reviewsSearchQuery.toLowerCase())
  );

  // Function to generate email content using LLM
  const generateEmailContent = async (review: ReviewInfo) => {
    setIsLoadingEmailContent(true);
    try {
      const response = await complianceAPI.generateReviewAlertContent({
        to_emails: emailAddresses.split(',').map(email => email.trim()),
        subject: emailSubject,
        review_data: {
          clinical_doc: review.clinicalDoc,
          compliance_doc: review.complianceDoc,
          issues: review.issues || 0,
          high_confidence_issues: review.highConfidenceIssues || 0,
          low_confidence_issues: review.lowConfidenceIssues || 0
        }
      });
      
      if (response.content) {
        setEmailContent(response.content);
      }
    } catch (error) {
      console.error('Error generating email content:', error);
      addToast('Failed to generate email content. Please try again.', 'error');
    } finally {
      setIsLoadingEmailContent(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Compliance Review</h2>
        
        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] shadow-sm transition-all duration-200"
            disabled={!selectedClinicalDoc || isAnalyzing}
            onClick={handleStartReview}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="font-medium">Analyzing...</span>
              </>
            ) : (
              <>
                <FiPlay className="w-4 h-4 mr-2" />
                <span className="font-medium">Start Compliance Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs for Documents and Reviews */}
      <div className="border-b mb-6">
        <div className="flex">
          <button 
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'documents' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button 
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'reviews' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              if (activeTab !== 'reviews') {
                setActiveTab('reviews');
                // Refresh reviews when switching to reviews tab
                fetchAllReviews();
              }
            }}
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Documents Table */}
      {activeTab === 'documents' && (
        <div className="h-[calc(100vh-200px)] flex flex-col overflow-hidden">
          {/* Documents List - now just clinical documents */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Clinical Documents</h3>
            
            {/* Search bar for clinical documents */}
            <div className="mb-4 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search clinical documents..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300 block w-full bg-white text-slate-900"
                  value={clinicalDocSearchQuery}
                  onChange={(e) => setclinicalDocSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="border rounded-lg overflow-auto flex-1 max-h-[calc(100vh-350px)] shadow-sm border-slate-200">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-left">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-700">Title</th>
                    {/* Format and Created columns commented out until backend provides data */}
                    <th className="py-3 px-4 text-xs font-semibold text-slate-700 w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClinicalDocs.map((doc) => (
                    <tr key={doc.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedClinicalDoc && selectedClinicalDoc.id === doc.id 
                        ? 'bg-gray-50 border-l-4 border-l-black' 
                        : ''
                    }`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FiFileText className="text-gray-500 mr-2 flex-shrink-0" />
                          <span className="truncate text-sm font-medium text-slate-900" title={doc.title}>{doc.title}</span>
                        </div>
                      </td>
                      {/* Format and Created columns commented out until backend provides data 
                      <td className="py-3 px-4 text-sm text-slate-700">{doc.format}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{doc.created}</td>
                      */}
                      <td className="py-3 px-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedClinicalDoc && selectedClinicalDoc.id === doc.id) {
                              setSelectedClinicalDoc(null);
                            } else {
                              setSelectedClinicalDoc({...doc, type: 'clinical'});
                            }
                          }}
                          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs rounded-md shadow-sm w-full transition-colors ${
                            selectedClinicalDoc && selectedClinicalDoc.id === doc.id 
                              ? 'bg-black text-white' 
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {selectedClinicalDoc && selectedClinicalDoc.id === doc.id ? (
                            <>
                              <FiCheck className="w-3 h-3" />
                              <span>Selected</span>
                            </>
                          ) : (
                            <span>Select</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredClinicalDocs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-500">
                        {clinicalDocSearchQuery ? 'No matching clinical documents found' : 'No clinical documents uploaded yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Count Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <div>
              Clinical Documents: {filteredClinicalDocs.length}
              {clinicalDocSearchQuery && (
                <span className="ml-1 text-gray-800">
                  (filtered from {documents.filter(doc => doc.type.toLowerCase() === 'clinical').length})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast container - add at the end but before other dialogs */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Reviews Table */}
      {activeTab === 'reviews' && (
        <>
          {/* Search bar for reviews */}
          <div className="mb-4 w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, clinical or compliance document..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300 block w-full bg-white text-slate-900"
                value={reviewsSearchQuery}
                onChange={(e) => setReviewsSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {reviews.length === 0 && !loadingReviews && !isAnalyzing ? (
            <div className="text-center py-8 text-gray-500">
              No reviews found. Start a compliance review to see results here.
            </div>
          ) : (
            <div className="h-[calc(100vh-300px)] overflow-auto rounded-md border border-slate-200">
              {loadingReviews && reviews.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">ID</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-slate-700">Clinical Document</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-slate-700">Compliance Document</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-slate-700">Status</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-slate-700">Issues</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-slate-700">Created</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isAnalyzing && (
                      <tr className="border-b border-slate-100 bg-amber-50 animate-pulse">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          Pending
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700 text-center">
                          <div className="max-w-[180px] truncate mx-auto" title={selectedClinicalDoc?.title}>
                            {selectedClinicalDoc?.title}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700 text-center">
                          <div className="max-w-[180px] truncate mx-auto">Auto-selecting...</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            <div className="animate-spin h-3 w-3 border-b-2 border-amber-800 rounded-full mr-1"></div>
                            Analyzing...
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-800 border border-gray-200 text-xs font-medium">
                              -
                            </span>
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-800 border border-gray-200 text-xs font-medium">
                              -
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700 text-center">Just now</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex space-x-2 justify-center opacity-50">
                            <button disabled className="text-xs text-blue-600 px-2 py-1 border border-blue-200 rounded flex items-center">
                              <FiEye className="w-3 h-3 mr-1" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredReviews.map((review) => (
                      <tr 
                        key={review.id} 
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          <div className="max-w-[120px] truncate" title={review.id}>{review.id}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700 text-center">
                          <div className="max-w-[180px] truncate mx-auto" title={review.clinicalDoc}>{review.clinicalDoc}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700 text-center">
                          <div className="max-w-[180px] truncate mx-auto" title={review.complianceDoc}>{review.complianceDoc}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            review.status === 'completed' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {review.status === 'completed' ? (
                              <>
                                <FiCheck className="mr-1 w-3 h-3" />
                                Completed
                              </>
                            ) : reviewsBeingDeleted.includes(review.id) ? (
                              <>
                                <div className="animate-spin h-3 w-3 border-b-2 border-amber-800 rounded-full mr-1"></div>
                                Deleting...
                              </>
                            ) : processingReviews[review.id] ? (
                              <>
                                <div className="animate-spin h-3 w-3 border-b-2 border-amber-800 rounded-full mr-1"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <FiAlertTriangle className="mr-1 w-3 h-3" />
                                In Progress
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-800 border border-red-200 text-xs font-medium" title="High confidence issues">
                              {review.highConfidenceIssues}
                            </span>
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs font-medium" title="Low confidence issues">
                              {review.lowConfidenceIssues}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700 text-center">{review.created}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex space-x-2 justify-center">
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center"
                              onClick={() => handleContinueReview(review)}
                              disabled={loadingReviewId === review.id}
                              title="View compliance review details"
                            >
                              {loadingReviewId === review.id ? (
                                <>
                                  <div className="animate-spin h-3 w-3 border-b-2 border-blue-800 rounded-full mr-1"></div>
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <FiEye className="w-3 h-3 mr-1" />
                                  View
                                </>
                              )}
                            </button>
                            <button 
                              className="text-xs text-orange-600 hover:text-orange-800 px-2 py-1 border border-orange-200 rounded hover:bg-orange-50 flex items-center transition-colors"
                              onClick={() => handleOpenAlertModal(review)}
                              title="Send alert to document owners"
                            >
                              <FiAlertTriangle className="w-3 h-3 mr-1" />
                              Alert
                            </button>
                            <button 
                              className="text-xs text-red-600 hover:text-red-800 p-1 border border-red-200 rounded hover:bg-red-50 flex items-center justify-center transition-colors w-6 h-6"
                              onClick={() => handleDeleteReview(review)}
                              disabled={reviewsBeingDeleted.includes(review.id)}
                              title="Delete"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredReviews.length === 0 && !isAnalyzing && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          {reviewsSearchQuery ? 'No matching reviews found' : 'No reviews available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          
          {/* Count display when filtered */}
          {reviewsSearchQuery && reviews.length > 0 && (
            <div className="mt-4 text-sm text-slate-600">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </div>
          )}
          
          {/* Email Alert Modal */}
          <EmailAlertModal 
            isOpen={showAlertModal}
            onClose={() => setShowAlertModal(false)}
            review={selectedReviewForAlert}
            onSendSuccess={handleAlertSuccess}
            onError={handleAlertError}
          />
        </>
      )}

      {/* Pagination */}
      {activeTab === 'documents' && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium">{selectedDocs.length} of {documents.length} row(s) selected.</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows per page</span>
              <select className="border border-slate-200 rounded px-2 py-1 text-xs bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <button className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span>Page 1 of 1</span>
              <button className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      {reviewToDelete && (
        <DeleteConfirmationDialog 
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setReviewToDelete(null);
          }}
          onConfirm={confirmDeleteReview}
          title="Delete Review"
          description={
            <div className="space-y-2">
              <p>Are you sure you want to permanently delete this review?</p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><span className="font-medium">Clinical Document:</span> {reviewToDelete.clinicalDoc}</p>
                <p><span className="font-medium">Compliance Document:</span> {reviewToDelete.complianceDoc}</p>
              </div>
              <p className="text-red-600 text-sm font-medium">This action cannot be undone.</p>
            </div>
          }
          isDeleting={reviewsBeingDeleted.includes(reviewToDelete.id)}
        />
      )}
    </div>
  );
};
