import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { documentAPI, complianceAPI } from '../services/api';
import { FiFileText, FiCheck, FiAlertTriangle, FiTrash2, FiEye, FiPlay, FiSearch } from 'react-icons/fi';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { ToastContainer, ToastType } from './Toast';

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

interface ReviewInfo {
  id: string;
  clinical_doc_id?: string;
  compliance_doc_id?: string;
  clinicalDoc: string;
  complianceDoc: string;
  status: 'completed' | 'processing';
  issues: number;
  highConfidenceIssues: number;
  lowConfidenceIssues: number;
  created: string;
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
  const [selectedComplianceDoc, setSelectedComplianceDoc] = useState<DocumentInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'reviews'>(
    location.state?.activeTab === 'reviews' ? 'reviews' : 'documents'
  );
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Reviews will use backend-generated UUIDs

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

  // State for reviews data and loading state
  const [reviews, setReviews] = useState<ReviewInfo[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  
  // Track reviews with processing status to update individually
  const [processingReviews, setProcessingReviews] = useState<{[key: string]: boolean}>({});
  
  // Track reviews that are being deleted
  const [reviewsBeingDeleted, setReviewsBeingDeleted] = useState<string[]>([]);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewInfo | null>(null);
  
  // Initial fetch to load all reviews - only called when tab changes or component mounts
  const fetchAllReviews = async () => {
    try {
      setLoadingReviews(true);
      const reviewsData = await complianceAPI.getReviews();
      setReviews(reviewsData || []);
      
      // Track which reviews are in processing state
      const processing = {};
      reviewsData.forEach(review => {
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
  
  // Function to check status of individual processing reviews
  const checkProcessingReviews = async () => {
    // Get IDs of all processing reviews
    const processingIds = Object.keys(processingReviews);
    
    if (processingIds.length === 0) return;
    
    try {
      // Fetch only the processing reviews to check their status
      const updatedReviews = await complianceAPI.getReviews();
      // Also check for any reviews being deleted
      const deletingIds = reviewsBeingDeleted;
      let hasStatusChanges = false;
      
      // Update only reviews that changed status
      setReviews(prevReviews => {
        return prevReviews.map(review => {
          const updatedReview = updatedReviews.find(r => r.id === review.id);
          
          // If this review was processing and now it's complete
          if (updatedReview && processingReviews[review.id] && updatedReview.status === 'completed') {
            hasStatusChanges = true;
            return updatedReview; // Return the updated review
          }
          
          return review; // Keep the existing review unchanged
        });
      });
      
      // Update processing reviews tracking if any changed to completed
      if (hasStatusChanges) {
        setProcessingReviews(prev => {
          const updated = {...prev};
          updatedReviews.forEach(review => {
            if (updated[review.id] && review.status === 'completed') {
              delete updated[review.id]; // Remove from processing
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
  
  // Set up polling only for processing reviews - much more efficient
  useEffect(() => {
    if (activeTab === 'reviews' && Object.keys(processingReviews).length > 0) {
      const statusCheckInterval = setInterval(() => {
        checkProcessingReviews();
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(statusCheckInterval);
    }
  }, [activeTab, processingReviews]);

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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleStartReview = async () => {
    if (selectedClinicalDoc && selectedComplianceDoc) {
      try {
        setIsAnalyzing(true);
        
        // Switch to the Reviews tab first to show analysis progress
        setActiveTab('reviews');
        
        // Create review with 'processing' status before analysis
        const placeholderUuid = 'frontend-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        
        // Create initial review with processing status
        await complianceAPI.createReview({
          id: placeholderUuid,
          clinical_doc_id: selectedClinicalDoc.id,
          compliance_doc_id: selectedComplianceDoc.id,
          clinicalDoc: selectedClinicalDoc.title,
          complianceDoc: selectedComplianceDoc.title,
          status: 'processing', // Show as processing initially
          issues: 0,
          highConfidenceIssues: 0,
          lowConfidenceIssues: 0,
          created: formattedDate
        });
        
        // With polling enabled, we don't need to manually fetch reviews here
        
        // Now call the backend API to analyze compliance (this might take time)
        const complianceResult = await complianceAPI.analyzeCompliance(
          selectedClinicalDoc.id,
          selectedComplianceDoc.id
        );
        
        // Count high and low confidence issues
        const highConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'high').length;
        const lowConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'low').length;
        
        // Update the review with the analysis results
        await complianceAPI.createReview({
          id: placeholderUuid, // Same ID to update the existing review
          clinical_doc_id: selectedClinicalDoc.id,
          compliance_doc_id: selectedComplianceDoc.id,
          clinicalDoc: selectedClinicalDoc.title,
          complianceDoc: selectedComplianceDoc.title,
          status: 'completed', // Now marked as completed
          issues: complianceResult.issues.length,
          highConfidenceIssues,
          lowConfidenceIssues,
          created: formattedDate
        });
        
        // Refresh the reviews list again to show the completed review
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
      // Only allow continuing if the review is completed
      if (review.status !== 'completed') {
        addToast('This review is still processing. Please wait until it completes.', 'info');
        return;
      }
      
      setIsAnalyzing(true);
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
    } catch (error) {
      console.error('Error continuing review:', error);
      addToast('Failed to continue review. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
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

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setSelectedDocs(
      checked
        ? [...selectedDocs, docId]
        : selectedDocs.filter(id => id !== docId)
    );
  };

  // const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'clinical' | 'compliance') => {
  //   // In a real implementation, this would handle file uploads
  //   // For now, just log that a file was selected
  //   if (event.target.files && event.target.files.length > 0) {
  //     console.log('File selected:', event.target.files[0].name);
  //     // You would typically upload this file to your backend here
  //   }
  // };

  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [selectedReviewForAlert, setSelectedReviewForAlert] = useState<ReviewInfo | null>(null);
  const [emailAddresses, setEmailAddresses] = useState<string>('');
  const [sendingAlert, setSendingAlert] = useState<boolean>(false);
  
  // Handle sending alerts to document owners
  const handleSendAlert = async () => {
    if (!selectedReviewForAlert || !emailAddresses.trim()) return;
    
    try {
      setSendingAlert(true);
      
      // Call the API to send the alert
      await complianceAPI.sendReviewAlert({
        review_id: selectedReviewForAlert.id,
        email_addresses: emailAddresses.split(',').map(email => email.trim()),
        clinical_doc: selectedReviewForAlert.clinicalDoc,
        compliance_doc: selectedReviewForAlert.complianceDoc,
        issues: selectedReviewForAlert.issues || 0,
        high_confidence_issues: selectedReviewForAlert.highConfidenceIssues || 0,
        low_confidence_issues: selectedReviewForAlert.lowConfidenceIssues || 0
      });
      
      // Show success toast
      addToast('Alert sent successfully to document owners.', 'success');
      
      // Close the modal and reset state
      setShowAlertModal(false);
      setSelectedReviewForAlert(null);
      setEmailAddresses('');
    } catch (error) {
      console.error('Error sending alert:', error);
      addToast('Failed to send alert. Please try again.', 'error');
    } finally {
      setSendingAlert(false);
    }
  };
  
  // Function to open alert modal
  const handleOpenAlertModal = (review: ReviewInfo) => {
    setSelectedReviewForAlert(review);
    setShowAlertModal(true);
  };

  // Search functionality
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState<string>('');
  const [clinicalDocSearchQuery, setclinicalDocSearchQuery] = useState<string>('');
  const [complianceDocSearchQuery, setComplianceDocSearchQuery] = useState<string>('');
  
  // Filter documents based on search queries
  const filteredClinicalDocs = documents
    .filter(doc => doc.type.toLowerCase() === 'clinical')
    .filter(doc => 
      doc.title.toLowerCase().includes(clinicalDocSearchQuery.toLowerCase())
    );
    
  const filteredComplianceDocs = documents
    .filter(doc => doc.type.toLowerCase() === 'compliance')
    .filter(doc => 
      doc.title.toLowerCase().includes(complianceDocSearchQuery.toLowerCase())
    );
    
  // Filter reviews based on search query
  const filteredReviews = reviews.filter(review => 
    review.id.toLowerCase().includes(reviewsSearchQuery.toLowerCase()) ||
    review.clinicalDoc.toLowerCase().includes(reviewsSearchQuery.toLowerCase()) ||
    review.complianceDoc.toLowerCase().includes(reviewsSearchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Compliance Review</h2>
        
        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] shadow-sm transition-all duration-200"
            disabled={!selectedClinicalDoc || !selectedComplianceDoc || isAnalyzing}
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
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Documents Table */}
      {activeTab === 'documents' && (
        <div className="h-[calc(100vh-200px)] flex flex-col overflow-hidden">
          {/* Documents Lists */}
          <div className="flex flex-1 overflow-hidden">
            {/* Clinical Documents */}
            <div className="flex-1 mr-4 flex flex-col overflow-hidden">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Clinical Documents</h3>
              
              {/* Search bar for clinical documents */}
              <div className="mb-4 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search clinical documents..."
                    className="pl-10 pr-4 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-0 focus:border-blue-300 block w-full bg-white text-slate-900"
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
                          ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                          : ''
                      }`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <FiFileText className="text-blue-500 mr-2 flex-shrink-0" />
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
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {selectedClinicalDoc && selectedClinicalDoc.id === doc.id ? (
                              <>
                                <FiCheck className="w-3 h-3" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select Clinical</span>
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

            {/* Compliance Documents */}
            <div className="flex-1 ml-4 flex flex-col overflow-hidden">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Compliance Documents</h3>
              
              {/* Search bar for compliance documents */}
              <div className="mb-4 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-green-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search compliance documents..."
                    className="pl-10 pr-4 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-0 focus:border-green-300 block w-full bg-white text-slate-900"
                    value={complianceDocSearchQuery}
                    onChange={(e) => setComplianceDocSearchQuery(e.target.value)}
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
                    {filteredComplianceDocs.map((doc) => (
                      <tr key={doc.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        selectedComplianceDoc && selectedComplianceDoc.id === doc.id 
                          ? 'bg-green-50 border-l-4 border-l-green-600' 
                          : ''
                      }`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <FiFileText className="text-green-500 mr-2 flex-shrink-0" />
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
                              if (selectedComplianceDoc && selectedComplianceDoc.id === doc.id) {
                                setSelectedComplianceDoc(null);
                              } else {
                                setSelectedComplianceDoc({...doc, type: 'compliance'});
                              }
                            }}
                            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs rounded-md shadow-sm w-full transition-colors ${
                              selectedComplianceDoc && selectedComplianceDoc.id === doc.id 
                                ? 'bg-green-600 text-white' 
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {selectedComplianceDoc && selectedComplianceDoc.id === doc.id ? (
                              <>
                                <FiCheck className="w-3 h-3" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select Compliance</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredComplianceDocs.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-500">
                          {complianceDocSearchQuery ? 'No matching compliance documents found' : 'No compliance documents uploaded yet'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Document Count Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <div>
              Clinical Documents: {filteredClinicalDocs.length}
              {clinicalDocSearchQuery && (
                <span className="ml-1 text-blue-600">
                  (filtered from {documents.filter(doc => doc.type.toLowerCase() === 'clinical').length})
                </span>
              )}
              {' | '}
              Compliance Documents: {filteredComplianceDocs.length}
              {complianceDocSearchQuery && (
                <span className="ml-1 text-blue-600">
                  (filtered from {documents.filter(doc => doc.type.toLowerCase() === 'compliance').length})
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
                <FiSearch className="h-5 w-5 text-indigo-500" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, clinical or compliance document..."
                className="pl-10 pr-4 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-0 focus:border-indigo-300 block w-full bg-white text-slate-900"
                value={reviewsSearchQuery}
                onChange={(e) => setReviewsSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews found. Start a compliance review to see results here.
            </div>
          ) : (
            <div className="h-[calc(100vh-300px)] overflow-auto rounded-md border border-slate-200">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">ID</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">Clinical Document</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">Compliance Document</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">Issues</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">Created</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr 
                      key={review.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        <div className="max-w-[120px] truncate" title={review.id}>{review.id}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        <div className="max-w-[180px] truncate" title={review.clinicalDoc}>{review.clinicalDoc}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        <div className="max-w-[180px] truncate" title={review.complianceDoc}>{review.complianceDoc}</div>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-800 border border-red-200 text-xs font-medium" title="High confidence issues">
                            {review.highConfidenceIssues}
                          </span>
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs font-medium" title="Low confidence issues">
                            {review.lowConfidenceIssues}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{review.created}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center"
                            onClick={() => handleContinueReview(review)}
                            disabled={isAnalyzing}
                            title="View compliance review details"
                          >
                            <FiEye className="w-3 h-3 mr-1" />
                            View
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
                  {filteredReviews.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {reviewsSearchQuery ? 'No matching reviews found' : 'No reviews available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Count display when filtered */}
          {reviewsSearchQuery && reviews.length > 0 && (
            <div className="mt-4 text-sm text-slate-600">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </div>
          )}
          
          {/* Alert Modal */}
          {showAlertModal && selectedReviewForAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[500px] max-w-full">
                <h3 className="text-lg font-semibold mb-4">Alert Document Owners</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Review Details:</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Clinical Document:</strong> {selectedReviewForAlert.clinicalDoc}</p>
                    <p><strong>Compliance Document:</strong> {selectedReviewForAlert.complianceDoc}</p>
                    <p><strong>Issues Found:</strong> {selectedReviewForAlert.issues || 0} total 
                      ({selectedReviewForAlert.highConfidenceIssues || 0} high confidence, 
                      {selectedReviewForAlert.lowConfidenceIssues || 0} low confidence)</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Owner Email Addresses
                    <span className="text-gray-500 font-normal"> (comma-separated)</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={emailAddresses}
                    onChange={(e) => setEmailAddresses(e.target.value)}
                    placeholder="e.g., owner1@example.com, owner2@example.com"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={() => {
                      setShowAlertModal(false);
                      setSelectedReviewForAlert(null);
                      setEmailAddresses('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    onClick={handleSendAlert}
                    disabled={sendingAlert || !emailAddresses.trim()}
                  >
                    {sendingAlert ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>Send Alert</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {activeTab === 'documents' && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium">{selectedDocs.length} of {documents.length} row(s) selected.</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows per page</span>
              <select className="border border-slate-200 rounded px-2 py-1 text-xs bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
