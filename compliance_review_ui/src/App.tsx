import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { DocumentList } from './components/DocumentList'
import { BreadcrumbNav } from './components/BreadcrumbNav'
import { Navigation } from './components/Navigation'
import { ComplianceReviewPage } from './components/ComplianceReviewPage'
import { HistoryDialog } from './components/HistoryDialog'
import { ComplianceDashboard } from './components/ComplianceDashboard'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import { InformationCollection } from './components/InformationCollection'
import { Document } from './types/compliance'
import { complianceAPI } from './services/api'
import { format } from 'date-fns'
import { SimpleMockDocumentViewer } from './components/SimpleMockDocumentViewer'

function App() {
  // Router hooks
  const navigate = useNavigate()
  const location = useLocation()
  
  // Main app state
  const [selectedTrial, setSelectedTrial] = useState('Phase III Study of Drug X for Lung Cancer')
  const [selectedDocument, setSelectedDocument] = useState<{ id: number; title: string } | null>(null)
  
  // Get current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname
    if (path.startsWith('/compliance')) return 'compliance'
    if (path.startsWith('/analytics')) return 'analytics'
    if (path.startsWith('/settings')) return 'settings'
    return 'home'
  }
  
  // Compliance review state
  const [showComplianceReview, setShowComplianceReview] = useState(false)
  const [reviewIssues, setReviewIssues] = useState<any[]>([])
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedClinicalDoc, setSelectedClinicalDoc] = useState<Document | null>(null)
  const [selectedComplianceDoc, setSelectedComplianceDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [reviewDecisions, setReviewDecisions] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Function to handle history button click
  const handleViewHistory = async () => {
    try {
      setLoadingHistory(true);
      // Fetch review decisions from the backend
      const reviews = await complianceAPI.getReviews();
      
      // Transform the reviews data into the format expected by HistoryDialog
      const decisions = reviews.flatMap((review: any) => {
        // Each review might have multiple issues/decisions
        if (!review.issues || review.issues.length === 0) return [];
        
        return review.issues.map((issue: any) => ({
          id: `${review.id}_${issue.id}`,
          issueId: issue.id,
          documentTitle: review.clinicalDoc,
          reviewId: review.id,
          text: issue.clinical_text || 'No text available',
          regulation: issue.regulation || 'Regulation not specified',
          status: issue.status || 'pending',
          decidedAt: format(new Date(review.created), 'MMM dd yyyy, h:mm a'),
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

  // Handle document selection from the document list
  const handleDocumentSelect = (doc: { id: number; title: string }) => {
    setSelectedDocument(doc);
  };
  
  // Handle document selection from the compliance dashboard
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
  
  // State to track if navigation to review is in progress
  const [isNavigatingToReview, setIsNavigatingToReview] = useState<boolean>(false);

  // Handle starting a compliance review or continuing an existing one
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
        } catch (reviewError) {
          console.error('Error loading review data:', reviewError);
          // Fall back to just loading issues if the complete review endpoint fails
          try {
            const reviewIssuesData = await complianceAPI.getIssuesByReviewId(reviewId);
            console.log('Loaded issues for existing review (fallback):', reviewIssuesData);
            setReviewIssues(reviewIssuesData || []);
          } catch (issuesError) {
            console.error('Error loading issues for review:', issuesError);
            // Continue even if we can't load issues
            setReviewIssues([]);
          }
        }
      } else {
        // This is a new review, so analyze the documents
        console.log('Starting new compliance analysis');
        const result = await complianceAPI.analyzeCompliance(
          clinicalDoc.id,
          complianceDoc.id
        );
        
        console.log('Compliance analysis result:', result);
        
        if (result.reviewId) {
          // Fetch the complete review to get document content
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
        
        setReviewIssues(result.issues || []);
      }
      
      // Show the review page
      setShowComplianceReview(true);
      
      // Navigate to the review route with reviewId in the URL for persistence
      const urlReviewId = reviewId || result?.reviewId || `temp_${Date.now()}`;
      navigate(`/compliance/review/${urlReviewId}`);
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

  // Handle navigation tab changes
  const handleTabChange = (tab: string) => {
    // Navigate to the appropriate route
    switch (tab) {
      case 'home':
        navigate('/')
        break
      case 'compliance':
        navigate('/compliance')
        break
      case 'analytics':
        navigate('/analytics')
        break
      case 'information':
        navigate('/information')
        break
      case 'settings':
        navigate('/settings')
        break
      default:
        navigate('/')
    }
    
    // Reset other states when changing tabs
    if (tab !== 'compliance') {
      setShowComplianceReview(false)
    }
  }

  // Removed renderMainContent function as it's replaced by route components

  // Get document ID from the URL for the document view route
  const getDocumentIdFromPath = () => {
    const path = location.pathname;
    if (path.startsWith('/document/')) {
      const id = parseInt(path.split('/').pop() || '0', 10);
      return id || null;
    }
    return null;
  };
  
  // Get review ID from the URL for the compliance review route
  const getReviewIdFromPath = () => {
    const path = location.pathname;
    if (path.startsWith('/compliance/review/')) {
      return path.split('/').pop() || null;
    }
    return null;
  };

  // Effect to synchronize URL document ID with selectedDocument state
  useEffect(() => {
    const docId = getDocumentIdFromPath();
    
    if (docId) {
      // If there's a document ID in the URL but no selected document (or different one)
      if (!selectedDocument || selectedDocument.id !== docId) {
        // Find the document in our mock data
        const documents = [
          { id: 1, title: 'Informed Consent Form' },
          { id: 2, title: 'Privacy Policy' },
          { id: 3, title: 'FDA Regulations & HIPAA Guidelines' }
        ];
        
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          setSelectedDocument(doc);
        }
      }
    } else if (location.pathname === '/' && selectedDocument) {
      // If we're on the home route but still have a selected document
      setSelectedDocument(null);
    }
  }, [location.pathname]);

  // Home tab content
  const HomeContent = () => {
    // Get document ID from URL
    const docId = getDocumentIdFromPath();
    
    // Mock documents data
    const documents = [
      { 
        id: 1, 
        title: 'Informed Consent Form', 
        warnings: 2, 
        format: 'PDF', 
        created: 'Apr 12 2024, 6:20 PM', 
        updated: '4 months ago'
      },
      { 
        id: 2, 
        title: 'Privacy Policy', 
        warnings: 2, 
        format: 'TXT', 
        created: 'Mar 15 2024, 1:45 PM', 
        updated: '5 months ago'
      },
      { 
        id: 3, 
        title: 'FDA Regulations & HIPAA Guidelines', 
        warnings: 0, 
        format: 'PDF', 
        created: 'Feb 20 2024, 10:30 AM', 
        updated: '6 months ago'
      }
    ];

    // If we're on a document route, display the document viewer
    if (docId || location.pathname.includes('/document/')) {
      const doc = selectedDocument || { id: docId || 0, title: 'Loading...' };
      return (
        <SimpleMockDocumentViewer
          documentId={doc.id}
          documentTitle={doc.title}
          onClose={() => {
            navigate('/');
          }}
        />
      );
    }
    
    // Otherwise, show the document list
    return (
      <>
        <div className="p-6">
          <BreadcrumbNav trial={selectedTrial} selectedDocument={selectedDocument} />
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Progress</h2>
            <div className="bg-gray-200 h-2 rounded-full mb-2">
              <div className="bg-black h-full w-[30%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>30% complete</span>
              <span>Estimated time to review: 2 hrs</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="mt-8">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-4 font-normal">ID</th>
                  <th className="pb-4 font-normal">Title</th>
                  <th className="pb-4 font-normal">Warnings to review</th>
                  <th className="pb-4 font-normal">File format</th>
                  <th className="pb-4 font-normal">Created</th>
                  <th className="pb-4 font-normal">Last updated</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      handleDocumentSelect({id: doc.id, title: doc.title});
                      navigate(`/document/${doc.id}`);
                    }}
                  >
                    <td className="py-4">{doc.id}</td>
                    <td className="py-4">{doc.title}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        {doc.warnings}
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
        </div>
      </>
    );
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
                format: 'pdf',
                created: fullReview.created || new Date().toISOString(),
                updated: fullReview.created || new Date().toISOString(),
                content: fullReview.clinical_doc_content
              };
              
              const complianceDoc: Document = {
                id: fullReview.compliance_doc_id || reviewId.replace('review_', 'compliance_'),
                title: fullReview.complianceDoc || 'Compliance Document',
                type: 'compliance',
                filename: fullReview.complianceDoc || '',
                path: '',
                size: 0,
                format: 'pdf',
                created: fullReview.created || new Date().toISOString(),
                updated: fullReview.created || new Date().toISOString(),
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
  }, [location.pathname, showComplianceReview]);

  // Compliance tab content
  const ComplianceContent = () => {
    // Get URL path to determine which view to show (check if it starts with /compliance/review)
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
  
  return isReviewRoute || showComplianceReview ? (
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
    );
  };

  // Analytics tab content
  const AnalyticsContent = () => (
    <div className="flex-1 overflow-auto">
      <AnalyticsDashboard />
    </div>
  );

  // Settings tab content (placeholder)
  const SettingsContent = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <p className="text-gray-600">Settings options coming soon.</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-white">
      <Navigation activeTab={getCurrentTab()} onTabChange={handleTabChange} />
      <Sidebar selectedTrial={selectedTrial} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <Routes>
            <Route path="/" element={<HomeContent />} />
            <Route path="/document/:id" element={<HomeContent />} />
            <Route path="/compliance" element={<ComplianceContent />} />
            <Route path="/compliance/review/:reviewId" element={<ComplianceContent />} />
            <Route path="/analytics" element={<AnalyticsContent />} />
            <Route path="/information" element={<InformationCollection onInformationSubmit={(info) => console.log('Information submitted:', info)} />} />
            <Route path="/settings" element={<SettingsContent />} />
          </Routes>
        </div>

        {/* History Dialog - Outside the main content div but still within the app */}
        <HistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => setShowHistoryDialog(false)}
          decisions={reviewDecisions}
          loading={loadingHistory}
        />
      </main>
    </div>
  )
}

export default App