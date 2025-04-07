import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { documentAPI, complianceAPI } from '../services/api';
import { Document } from '../types/compliance';
import { FiUpload, FiFileText, FiCheck, FiAlertTriangle, FiPlus, FiMinus, FiRefreshCw } from 'react-icons/fi';
import * as Checkbox from '@radix-ui/react-checkbox';

interface Document {
  id: string;
  title: string;
  type: 'clinical' | 'compliance';
  format: string;
  created: string;
  updated: string;
  issueCount?: number;
}

interface ComplianceDashboardProps {
  onDocumentSelect: (doc: Document) => void;
  onStartReview: (clinicalDoc: Document, complianceDoc: Document) => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ 
  onDocumentSelect,
  onStartReview
}) => {
  const location = useLocation();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedClinicalDoc, setSelectedClinicalDoc] = useState<Document | null>(null);
  const [selectedComplianceDoc, setSelectedComplianceDoc] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'reviews'>(
    location.state?.activeTab === 'reviews' ? 'reviews' : 'documents'
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

  // Fetch documents from the backend API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const docs = await documentAPI.getDocuments();
        console.log('Fetched documents:', docs);
        
        // Ensure document types are properly formatted
        const formattedDocs = docs.map(doc => ({
          ...doc,
          type: String(doc.type).toLowerCase() as 'clinical' | 'compliance'
        }));
        
        setDocuments(formattedDocs);
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again.');
        // No fallback to mock data - we want to use the real API
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);

  // State for reviews data
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  
  // Fetch reviews from the backend API
  useEffect(() => {
    const fetchReviews = async () => {
      if (activeTab === 'reviews') {
        try {
          setLoadingReviews(true);
          // Use the compliance API to fetch reviews
          const reviewsData = await complianceAPI.getReviews();
          setReviews(reviewsData || []);
        } catch (err) {
          console.error('Error fetching reviews:', err);
          setReviews([]);
        } finally {
          setLoadingReviews(false);
        }
      }
    };
    
    fetchReviews();
  }, [activeTab]);

  const handleDocumentSelect = (doc: Document) => {
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
    
    onDocumentSelect({...doc, type: docType}); // Ensure consistent type in callback
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleStartReview = async () => {
    if (selectedClinicalDoc && selectedComplianceDoc) {
      try {
        setIsAnalyzing(true);
        
        // Call the backend API to analyze compliance
        const complianceResult = await complianceAPI.analyzeCompliance(
          selectedClinicalDoc.id,
          selectedComplianceDoc.id
        );
        
        // Create a review record in the backend
        const reviewId = `review_${Date.now()}`;
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        
        // Count high and low confidence issues
        const highConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'high').length;
        const lowConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'low').length;
        
        await complianceAPI.createReview({
          id: reviewId,
          clinical_doc_id: selectedClinicalDoc.id,
          compliance_doc_id: selectedComplianceDoc.id,
          clinicalDoc: selectedClinicalDoc.title,
          complianceDoc: selectedComplianceDoc.title,
          status: 'completed',
          issues: complianceResult.issues.length,
          highConfidenceIssues,
          lowConfidenceIssues,
          created: formattedDate
        });
        
        // If successful, proceed with the review
        onStartReview(selectedClinicalDoc, selectedComplianceDoc);
      } catch (error) {
        console.error('Error analyzing compliance:', error);
        setError('Failed to analyze compliance. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // Handle continuing an existing review
  const handleContinueReview = async (review: any) => {
    try {
      setIsAnalyzing(true);
      console.log('Continuing review:', review);
      
      // Create document objects from the review data
      const clinicalDoc = {
        id: review.clinical_doc_id || review.id.replace('review_', 'clinical_'),
        title: review.clinicalDoc,
        type: 'clinical'
      };
      
      const complianceDoc = {
        id: review.compliance_doc_id || review.id.replace('review_', 'compliance_'),
        title: review.complianceDoc,
        type: 'compliance'
      };
      
      // Set the selected documents
      setSelectedClinicalDoc(clinicalDoc);
      setSelectedComplianceDoc(complianceDoc);
      
      // If successful, proceed with the review
      onStartReview(clinicalDoc, complianceDoc);
    } catch (error) {
      console.error('Error continuing review:', error);
      setError('Failed to continue review. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle refreshing the analysis with force refresh
  const handleRefreshAnalysis = async (review: any) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setSuccess(null);
      console.log('Refreshing analysis for review:', review);
      
      // Create document objects from the review data
      const clinicalDoc = {
        id: review.clinical_doc_id || review.id.replace('review_', 'clinical_'),
        title: review.clinicalDoc,
        type: 'clinical'
      };
      
      const complianceDoc = {
        id: review.compliance_doc_id || review.id.replace('review_', 'compliance_'),
        title: review.complianceDoc,
        type: 'compliance'
      };
      
      // Call the backend API to analyze compliance with force_refresh set to true
      const complianceResult = await complianceAPI.analyzeCompliance(
        clinicalDoc.id,
        complianceDoc.id,
        true // Force refresh
      );
      
      // Count high and low confidence issues
      const highConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'high').length;
      const lowConfidenceIssues = complianceResult.issues.filter(issue => issue.confidence === 'low').length;
      
      // Update the existing review with new counts
      await complianceAPI.createReview({
        id: review.id,
        clinical_doc_id: clinicalDoc.id,
        compliance_doc_id: complianceDoc.id,
        clinicalDoc: clinicalDoc.title,
        complianceDoc: complianceDoc.title,
        status: 'completed',
        issues: complianceResult.issues.length,
        highConfidenceIssues,
        lowConfidenceIssues,
        created: review.created
      });
      
      // Refresh the reviews list
      await fetchReviews();
      
      // Show success message
      setSuccess(`Analysis refreshed successfully! Found ${complianceResult.issues.length} issues.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      setError('Failed to refresh analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setSelectedDocs(
      checked
        ? [...selectedDocs, docId]
        : selectedDocs.filter(id => id !== docId)
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 cursor-pointer">
            <FiUpload className="w-4 h-4" />
            <span>Upload Document</span>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload}
              accept=".pdf,.txt,.doc,.docx"
            />
          </label>
          
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
        <div>
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr className="text-left">
                <th className="pb-4 font-normal w-10">
                  <Checkbox.Root
                    className="flex h-4 w-4 items-center justify-center rounded border border-gray-300"
                    checked={selectedDocs.length === documents.length}
                    onCheckedChange={(checked) => {
                      setSelectedDocs(checked ? documents.map(d => d.id) : [])
                    }}
                  >
                    <Checkbox.Indicator className="text-black">
                      <FiCheck className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </th>
                <th className="pb-4 font-normal">ID</th>
                <th className="pb-4 font-normal">Title</th>
                <th className="pb-4 font-normal">Type</th>
                <th className="pb-4 font-normal">File format</th>
                <th className="pb-4 font-normal">Created</th>
                <th className="pb-4 font-normal">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr 
                  key={doc.id} 
                  className={`border-t border-gray-100 hover:bg-gray-50 ${(
                    (selectedClinicalDoc && selectedClinicalDoc.id === doc.id) || 
                    (selectedComplianceDoc && selectedComplianceDoc.id === doc.id)
                  ) ? 'bg-gray-50' : ''}`}
                >
                  <td className="py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox.Root
                      className="flex h-4 w-4 items-center justify-center rounded border border-gray-300"
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={(checked) => {
                        handleCheckboxChange(doc.id, !!checked);
                      }}
                    >
                      <Checkbox.Indicator className="text-black">
                        <FiCheck className="h-3 w-3" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                  </td>
                  <td className="py-4 truncate">
                    <div className="max-w-full break-words overflow-hidden text-ellipsis" title={doc.id}>
                      {doc.id}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="truncate mr-2">{doc.title}</div>
                      <div className="ml-auto">
                        {String(doc.type).toLowerCase() === 'clinical' ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedClinicalDoc && selectedClinicalDoc.id === doc.id) {
                                setSelectedClinicalDoc(null);
                              } else {
                                setSelectedClinicalDoc({...doc, type: 'clinical'});
                              }
                            }}
                            className={`flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-md w-[160px] ${selectedClinicalDoc && selectedClinicalDoc.id === doc.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                          >
                            {selectedClinicalDoc && selectedClinicalDoc.id === doc.id ? (
                              <>
                                <FiCheck className="w-3 h-3 flex-shrink-0" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select Clinical</span>
                            )}
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedComplianceDoc && selectedComplianceDoc.id === doc.id) {
                                setSelectedComplianceDoc(null);
                              } else {
                                setSelectedComplianceDoc({...doc, type: 'compliance'});
                              }
                            }}
                            className={`flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-md w-[160px] ${selectedComplianceDoc && selectedComplianceDoc.id === doc.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                          >
                            {selectedComplianceDoc && selectedComplianceDoc.id === doc.id ? (
                              <>
                                <FiCheck className="w-3 h-3 flex-shrink-0" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select Compliance</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      String(doc.type).toLowerCase() === 'clinical' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {String(doc.type).toLowerCase() === 'clinical' ? 'Clinical' : 'Compliance'}
                    </span>
                  </td>
                  <td className="py-4">{doc.format}</td>
                  <td className="py-4">{doc.created}</td>
                  <td className="py-4">{doc.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div>
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
                          className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center"
                          onClick={() => handleRefreshAnalysis(review)}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <div className="animate-spin h-3 w-3 border-b-2 border-gray-600 rounded-full mr-1"></div>
                          ) : (
                            <FiRefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Refresh
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
