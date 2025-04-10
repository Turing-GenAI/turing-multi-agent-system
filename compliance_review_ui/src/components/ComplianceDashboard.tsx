import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { documentAPI, complianceAPI } from '../services/api';
import { Document } from '../types/compliance';
import { FiUpload, FiFileText, FiCheck, FiAlertTriangle, FiPlus, FiMinus, FiTrash2, FiLoader } from 'react-icons/fi';
import * as Checkbox from '@radix-ui/react-checkbox';

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

  // Fetch documents from the backend API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const docs = await documentAPI.getDocuments();
        console.log('Fetched documents:', docs);
        
        // Ensure document types are properly formatted
        const formattedDocs = docs.map((doc: any) => ({
          ...doc,
          type: String(doc.type).toLowerCase() as 'clinical' | 'compliance'
        }));
        
        setDocuments(formattedDocs);
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);

  // State for reviews data and loading state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  
  // Track reviews with processing status to update individually
  const [processingReviews, setProcessingReviews] = useState<{[key: string]: boolean}>({});
  
  // Track reviews that are being deleted
  const [reviewsBeingDeleted, setReviewsBeingDeleted] = useState<string[]>([]);
  
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
      const deletingIds = Object.keys(deletingReviews);
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
        
        // Set success message
        setSuccess(`Analysis complete. ${complianceResult.issues.length} issue(s) found.`);
        setTimeout(() => setSuccess(null), 5000); // Clear after 5 seconds
      } catch (error) {
        console.error('Error analyzing compliance:', error);
        setError('Failed to analyze compliance. Please try again.');
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
  const handleContinueReview = async (review: any) => {
    try {
      // Only allow continuing if the review is completed
      if (review.status !== 'completed') {
        setError('This review is still processing. Please wait until it completes.');
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
      setError('Failed to continue review. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle deleting a review
  const handleDeleteReview = async (review: any) => {
    // Show confirmation dialog before deleting
    if (!window.confirm(`Are you sure you want to permanently delete this review?\n\nClinical Document: ${review.clinicalDoc}\nCompliance Document: ${review.complianceDoc}\n\nThis action cannot be undone.`)) {
      return; // User cancelled the deletion
    }
    
    try {
      // Set loading state for this specific review
      const reviewId = review.id;
      setReviewsBeingDeleted(prev => [...prev, reviewId]);
      setError(null);
      setSuccess(null);
      console.log('Deleting review:', reviewId);
      
      // Call the delete API endpoint
      await complianceAPI.deleteReview(reviewId);
      
      // Remove the deleted review from the local state
      setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));
      
      // Show success message
      setSuccess(`Review deleted successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('Failed to delete review. Please try again.');
    } finally {
      // Remove from loading state
      setReviewsBeingDeleted(prev => prev.filter(id => id !== review.id));
    }
  };

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setSelectedDocs(
      checked
        ? [...selectedDocs, docId]
        : selectedDocs.filter(id => id !== docId)
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'clinical' | 'compliance') => {
    // In a real implementation, this would handle file uploads
    // For now, just log that a file was selected
    if (event.target.files && event.target.files.length > 0) {
      console.log('File selected:', event.target.files[0].name);
      // You would typically upload this file to your backend here
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Compliance Review</h2>
        
        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
            disabled={!selectedClinicalDoc || !selectedComplianceDoc || isAnalyzing}
            onClick={handleStartReview}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Start Compliance Review</span>
            )}
          </button>
        </div>
      </div>

      {/* Selected documents for review */}
      {(selectedClinicalDoc || selectedComplianceDoc) && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Selected for Review</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">Clinical Document</h4>
              {selectedClinicalDoc ? (
                <div className="flex items-center gap-2">
                  <FiFileText className="text-blue-500" />
                  <span>{selectedClinicalDoc.title}</span>
                  <button 
                    className="ml-auto text-sm text-gray-500 hover:text-red-500"
                    onClick={() => setSelectedClinicalDoc(null)}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No clinical document selected</p>
              )}
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">Compliance Document</h4>
              {selectedComplianceDoc ? (
                <div className="flex items-center gap-2">
                  <FiFileText className="text-green-500" />
                  <span>{selectedComplianceDoc.title}</span>
                  <button 
                    className="ml-auto text-sm text-gray-500 hover:text-red-500"
                    onClick={() => setSelectedComplianceDoc(null)}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No compliance document selected</p>
              )}
            </div>
          </div>
        </div>
      )}

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
          {/* Upload Buttons Row - Temporarily commented out
          <div className="flex justify-between mb-6">
            <div className="flex-1 mr-4">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer w-full">
                <FiUpload className="w-4 h-4" />
                <span>Upload Clinical Document</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'clinical')}
                  accept=".pdf,.txt,.doc,.docx"
                />
              </label>
            </div>
            <div className="flex-1 ml-4">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer w-full">
                <FiUpload className="w-4 h-4" />
                <span>Upload Compliance Document</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'compliance')}
                  accept=".pdf,.txt,.doc,.docx"
                />
              </label>
            </div>
          </div>
          */}

          {/* Documents Lists */}
          <div className="flex flex-1 overflow-hidden">
            {/* Clinical Documents */}
            <div className="flex-1 mr-4 flex flex-col overflow-hidden">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Clinical Documents</h3>
              <div className="border rounded-lg overflow-auto flex-1 max-h-[calc(100vh-300px)]">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="py-3 px-4 font-medium">Title</th>
                      <th className="py-3 px-4 font-medium w-24">Format</th>
                      <th className="py-3 px-4 font-medium w-32">Created</th>
                      <th className="py-3 px-4 font-medium w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents
                      .filter(doc => doc.type.toLowerCase() === 'clinical')
                      .map((doc) => (
                        <tr key={doc.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <FiFileText className="text-blue-500 mr-2" />
                              <span className="truncate" title={doc.title}>{doc.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{doc.format}</td>
                          <td className="py-3 px-4">{doc.created}</td>
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
                              className={`flex items-center justify-center gap-1 px-3 py-1 text-xs rounded-md w-full ${
                                selectedClinicalDoc && selectedClinicalDoc.id === doc.id 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
                    {documents.filter(doc => doc.type.toLowerCase() === 'clinical').length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No clinical documents uploaded yet
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
              <div className="border rounded-lg overflow-auto flex-1 max-h-[calc(100vh-300px)]">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="py-3 px-4 font-medium">Title</th>
                      <th className="py-3 px-4 font-medium w-24">Format</th>
                      <th className="py-3 px-4 font-medium w-32">Created</th>
                      <th className="py-3 px-4 font-medium w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents
                      .filter(doc => doc.type.toLowerCase() === 'compliance')
                      .map((doc) => (
                        <tr key={doc.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <FiFileText className="text-green-500 mr-2" />
                              <span className="truncate" title={doc.title}>{doc.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{doc.format}</td>
                          <td className="py-3 px-4">{doc.created}</td>
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
                              className={`flex items-center justify-center gap-1 px-3 py-1 text-xs rounded-md w-full ${
                                selectedComplianceDoc && selectedComplianceDoc.id === doc.id 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
                    {documents.filter(doc => doc.type.toLowerCase() === 'compliance').length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No compliance documents uploaded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Document Count Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Clinical Documents: {documents.filter(doc => doc.type.toLowerCase() === 'clinical').length} | 
              Compliance Documents: {documents.filter(doc => doc.type.toLowerCase() === 'compliance').length}
            </div>
          </div>
        </div>
      )}

      {/* Success or Error Messages */}
      {(success || error) && (
        <div className={`mb-4 p-3 rounded ${success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {success || error}
        </div>
      )}
      
      {/* Reviews Table */}
      {activeTab === 'reviews' && (
        <>
          {loadingReviews ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews found. Start a compliance review to see results here.
            </div>
          ) : (
            <div className="h-[calc(100vh-250px)] overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-4 font-normal">ID</th>
                    <th className="pb-4 font-normal">Clinical Document</th>
                    <th className="pb-4 font-normal">Compliance Document</th>
                    <th className="pb-4 font-normal">Status</th>
                    <th className="pb-4 font-normal">Issues</th>
                    <th className="pb-4 font-normal">Created</th>
                    <th className="pb-4 font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                  <tr 
                    key={review.id} 
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4">
                      <div className="max-w-[120px] truncate" title={review.id}>{review.id}</div>
                    </td>
                    <td className="py-4">
                      <div className="max-w-[180px] truncate" title={review.clinicalDoc}>{review.clinicalDoc}</div>
                    </td>
                    <td className="py-4">
                      <div className="max-w-[180px] truncate" title={review.complianceDoc}>{review.complianceDoc}</div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        review.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
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
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          {review.highConfidenceIssues}
                        </span>
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          {review.lowConfidenceIssues}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">{review.created}</td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <button 
                          className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                          onClick={() => handleContinueReview(review)}
                          disabled={isAnalyzing}
                        >
                          Continue Review
                        </button>
                        <button 
                          className="text-sm text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded-md hover:bg-red-50 flex items-center"
                          onClick={() => handleDeleteReview(review)}
                          disabled={reviewsBeingDeleted.includes(review.id)}
                        >
                          <FiTrash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {activeTab === 'documents' && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>{selectedDocs.length} of {documents.length} row(s) selected.</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select className="border border-gray-200 rounded px-2 py-1">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
          <div>
            Page 1 of 1
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
