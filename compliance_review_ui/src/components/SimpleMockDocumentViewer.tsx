import React, { useState } from 'react';
import { FiChevronRight, FiChevronLeft, FiMaximize, FiMinimize, FiX, FiCheck, FiAlertTriangle, FiUser, FiClock } from 'react-icons/fi';

interface MockIssue {
  id: string;
  text: string;
  startIndex: number;
  explanation: string;
  regulation: string;
  suggestedEdit: string;
  confidence: 'high' | 'low';
  status?: 'accepted' | 'rejected' | 'pending';
}

interface SimpleMockDocumentViewerProps {
  documentId: number;
  documentTitle: string;
  onClose: () => void;
}

const MOCK_DOCUMENT_CONTENT = {
  1: {
    content: `<h1>Informed Consent Form</h1>
    <p><strong>Study Title:</strong> Investigating the Impact of Innovative Medication on Chronic Pain<br/>
    <strong>Principal Investigator:</strong> Dr. Sarah Thompson<br/>
    <strong>Contact Information:</strong><br/>
    Phone: (555) 987-6543<br/>
    Email: sarah.thompson@clinicaltrials.com</p>
    
    <p><strong>Purpose of the Study:</strong><br/>
    You are invited to take part in a research study aimed at assessing the effectiveness and safety of a new medication intended to relieve chronic pain.</p>
    
    <p><strong>Study Procedures:</strong><br/>
    If you choose to participate, you will go through the following steps:</p>
    <ul>
    <li>Initial screening visit to check eligibility</li>
    <li>Random assignment to either the treatment or placebo group</li>
    <li>Regular follow-up visits over a span of 12 weeks</li>
    <li>Filling out questionnaires about your pain levels and overall health</li>
    </ul>
    
    <p><strong>Dosing:</strong><br/>
    Use the device as needed when pain occurs.</p>
    
    <p><strong>Confidentiality:</strong><br/>
    Your personal information will remain confidential and will only be utilized for research purposes.</p>
    
    <p><strong>Voluntary Participation:</strong><br/>
    Your involvement is voluntary, and you can withdraw at any time without facing any penalties.</p>
    
    <p><strong>Consent:</strong><br/>
    By signing below, you confirm that you have read and understood the information provided and agree to participate in this study.</p>
    <p>Signature: _______________________<br/>
    Date: _______________________</p>`,
    issues: [
      {
        id: "issue-1",
        text: "Use the device as needed when pain occurs.",
        startIndex: 0,
        explanation: "The dosing information lacks specific guidance on frequency and maximum dosage, which is required per ICH E6(R2) section 4.8.10.",
        regulation: "ICH E6(R2) section 4.8.10",
        suggestedEdit: "Use the device as needed when pain occurs, but not more than 3 times daily and with at least 4 hours between uses.",
        confidence: "high",
        status: "pending"
      },
      {
        id: "issue-2",
        text: "Your personal information will remain confidential and will only be utilized for research purposes.",
        startIndex: 0,
        explanation: "The confidentiality statement does not specify the data retention period or how data will be protected, which is required by GDPR Article 13.",
        regulation: "GDPR Article 13",
        suggestedEdit: "Your personal information will remain confidential, be securely stored with encryption, and will only be utilized for research purposes. Data will be retained for 5 years after study completion and then securely destroyed.",
        confidence: "low",
        status: "pending"
      }
    ]
  },
  2: {
    content: `<h1>Privacy Policy</h1>
    <p>Last Updated: March 15, 2024</p>
    
    <h2>1. Introduction</h2>
    <p>This Privacy Policy describes how we collect, use, and disclose your personal information when you participate in our clinical trial. By agreeing to participate, you consent to the practices described in this policy.</p>
    
    <h2>2. Information We Collect</h2>
    <p>We may collect the following types of information:</p>
    <ul>
      <li>Personal identifiable information including your name, contact details, and date of birth</li>
      <li>Medical information including your medical history, current medications, and health status</li>
      <li>Study data collected during your participation</li>
    </ul>
    
    <h2>3. How We Use Your Information</h2>
    <p>Your data may be used for:</p>
    <ul>
      <li>Conducting the clinical trial and related research</li>
      <li>Regulatory compliance and reporting</li>
      <li>Improving our research methodologies</li>
      <li>Publication of anonymized results in medical journals</li>
    </ul>
    
    <h2>4. Data Sharing</h2>
    <p>We may share your data with third parties including regulatory authorities, research partners, and journal publishers. Your personal identifiers will be removed before sharing when possible.</p>
    
    <h2>5. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact us at privacy@clinicaltrial.com.</p>`,
    issues: [
      {
        id: "issue-1",
        text: "By agreeing to participate, you consent to the practices described in this policy.",
        startIndex: 0,
        explanation: "Under GDPR, consent must be freely given, specific, informed, and unambiguous. This statement implies that consent is tied to participation, which is not compliant with GDPR Article 7.",
        regulation: "GDPR Article 7",
        suggestedEdit: "We process your personal data as described in this policy based on our legitimate interests in conducting research. You maintain separate rights regarding your personal data as outlined in section 6.",
        confidence: "high",
        status: "pending"
      },
      {
        id: "issue-2",
        text: "We may share your data with third parties including regulatory authorities, research partners, and journal publishers.",
        startIndex: 0,
        explanation: "The statement lacks specificity required by HIPAA Privacy Rule and GDPR regarding which specific third parties will receive data and for what exact purposes.",
        regulation: "HIPAA Privacy Rule; GDPR Article 13",
        suggestedEdit: "We may share your de-identified data with the following specific entities: FDA for regulatory compliance; Johnson & Johnson Research Team for analysis; and the New England Journal of Medicine for publication purposes only. Your identifiable information will only be shared as required by law or with your explicit consent.",
        confidence: "low",
        status: "pending"
      }
    ]
  },
  3: {
    content: `<h1>FDA Regulations & HIPAA Guidelines</h1>
    <p>This document outlines key FDA regulations and HIPAA guidelines applicable to our clinical trials.</p>
    
    <h2>FDA Regulations</h2>
    <p>All clinical trials must comply with the following FDA regulations:</p>
    <ul>
      <li><strong>21 CFR Part 50:</strong> Protection of Human Subjects</li>
      <li><strong>21 CFR Part 56:</strong> Institutional Review Boards</li>
      <li><strong>21 CFR Part 312:</strong> Investigational New Drug Application</li>
      <li><strong>21 CFR Part 314:</strong> Applications for FDA Approval to Market a New Drug</li>
    </ul>
    
    <h2>HIPAA Guidelines</h2>
    <p>As a covered entity, we must comply with HIPAA regulations for protecting patient health information:</p>
    <ul>
      <li><strong>Privacy Rule:</strong> Establishes national standards for the protection of health information</li>
      <li><strong>Security Rule:</strong> Specifies safeguards to protect electronic protected health information</li>
      <li><strong>Breach Notification Rule:</strong> Requires notification following a breach of unsecured PHI</li>
    </ul>
    
    <h2>ICH Guidelines</h2>
    <p>We also adhere to International Council for Harmonisation (ICH) guidelines, particularly:</p>
    <ul>
      <li><strong>ICH E6(R2):</strong> Good Clinical Practice</li>
      <li><strong>ICH E8:</strong> General Considerations for Clinical Trials</li>
      <li><strong>ICH E9:</strong> Statistical Principles for Clinical Trials</li>
    </ul>`,
    issues: []
  }
};

const COMPLIANCE_REGULATIONS = {
  "ICH E6(R2) section 4.8.10": `The language used in all informed consent documentation must be as non-technical as practical and should be understandable to the subject. Dosing instructions should include clear information on dosage, frequency, maximum daily dosage, and safety intervals between doses.`,
  
  "GDPR Article 7": `Consent should be given by a clear affirmative act establishing a freely given, specific, informed and unambiguous indication of the data subject's agreement to the processing of personal data relating to him or her. Consent to participate in a clinical trial should be separate from consent for data processing.`,
  
  "GDPR Article 13": `The data controller shall provide the data subject with information relating to the processing of personal data, including the period for which the personal data will be stored, or the criteria used to determine that period, and the existence of appropriate safeguards relating to the transfer.`,
  
  "HIPAA Privacy Rule": `A covered entity must disclose protected health information to the individual who is the subject of the information. For any other disclosure, a covered entity must obtain written authorization from the individual, unless the disclosure is for treatment, payment, health care operations, or another exception listed in the Rule.`
};

export const SimpleMockDocumentViewer: React.FC<SimpleMockDocumentViewerProps> = ({
  documentId,
  documentTitle,
  onClose
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  
  // Get document content and issues from mock data
  const documentData = MOCK_DOCUMENT_CONTENT[documentId as keyof typeof MOCK_DOCUMENT_CONTENT] || 
    { content: '<p>No content available</p>', issues: [] };
  
  const { content, issues } = documentData;
  
  // Mock history data
  const mockHistory = [
    { 
      date: '2024-04-01', 
      user: 'Sarah Johnson', 
      document: 'Informed Consent Form',
      decision: 'Accepted',
      issue: 'The dosing information lacks specific guidance on frequency'
    },
    { 
      date: '2024-03-28', 
      user: 'Robert Chen', 
      document: 'Privacy Policy',
      decision: 'Rejected',
      issue: 'Under GDPR, consent must be freely given, specific, informed, and unambiguous'
    },
    { 
      date: '2024-03-25', 
      user: 'Michelle Wong', 
      document: 'Study Protocol',
      decision: 'Accepted',
      issue: 'Protocol lacks specific inclusion/exclusion criteria'
    }
  ];
  
  // Handle accepting or rejecting an issue
  const handleIssueAction = (issueId: string, action: 'accept' | 'reject') => {
    alert(`Mock ${action} action for issue ${issueId}. In a real app, this would update the backend.`);
  };
  
  // Navigate to next/previous issue
  const navigateIssue = (direction: 'next' | 'prev') => {
    if (issues.length === 0) return;
    
    if (direction === 'next' && currentIssueIndex < issues.length - 1) {
      setCurrentIssueIndex(currentIssueIndex + 1);
    } else if (direction === 'prev' && currentIssueIndex > 0) {
      setCurrentIssueIndex(currentIssueIndex - 1);
    }
  };
  
  // Function to highlight issues in the document content
  const highlightIssues = () => {
    let highlightedContent = content;
    
    issues.forEach((issue, index) => {
      const confidenceClass = issue.confidence === 'high' ? 'bg-red-200' : 'bg-yellow-200';
      const isCurrentClass = index === currentIssueIndex ? 'ring-2 ring-blue-400' : '';
      
      // Replace the text with highlighted version
      highlightedContent = highlightedContent.replace(
        issue.text,
        `<span 
          id="issue-${issue.id}" 
          class="${confidenceClass} ${isCurrentClass} px-1 cursor-pointer" 
          onClick="document.dispatchEvent(new CustomEvent('issueClick', {detail: ${index}}))"
        >
          ${issue.text}
        </span>`
      );
    });
    
    return highlightedContent;
  };
  
  // Send alert to document owners (mock)
  const sendAlert = () => {
    alert("Mock alert sent to document owners with review results!");
  };

  // Current issue for the detail panel
  const currentIssue = issues[currentIssueIndex];
  
  // Event listener for issue clicks in the document
  React.useEffect(() => {
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
    <div className={`bg-white ${fullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{documentTitle}</h2>
          
          <div className="flex items-center gap-2">
            {/* Mock UI Controls */}
            <button 
              className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={sendAlert}
            >
              Alert Document Owners
            </button>
            
            <button 
              className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
              onClick={() => setShowHistory(!showHistory)}
            >
              View History
            </button>
            
            <button 
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 rounded hover:bg-gray-100"
            >
              {fullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
            
            <button 
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100"
            >
              <FiX />
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Document content */}
          <div className="w-3/5 overflow-auto p-6 border-r">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: highlightIssues() }} />
            </div>
          </div>
          
          {/* Issue details panel */}
          <div className="w-2/5 overflow-auto">
            {showHistory ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Decision History</h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    Back to Issues
                  </button>
                </div>
                
                <div className="space-y-4">
                  {mockHistory.map((item, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          <FiClock className="inline mr-1" /> {item.date}
                        </span>
                        <span className="text-sm">
                          <FiUser className="inline mr-1" /> {item.user}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium">{item.document}</p>
                        <p className="text-sm mt-1">{item.issue}</p>
                      </div>
                      <div className="mt-2">
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          item.decision === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.decision}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : issues.length > 0 && currentIssue ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Issue Details</h3>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={currentIssueIndex === 0}
                      onClick={() => navigateIssue('prev')}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <FiChevronLeft />
                    </button>
                    <span className="text-sm">
                      {currentIssueIndex + 1} of {issues.length}
                    </span>
                    <button
                      disabled={currentIssueIndex === issues.length - 1}
                      onClick={() => navigateIssue('next')}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Issue type and confidence */}
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      currentIssue.confidence === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <FiAlertTriangle className="inline mr-1" />
                      {currentIssue.confidence === 'high' ? 'High Confidence Issue' : 'Low Confidence Issue'}
                    </span>
                  </div>
                  
                  {/* Explanation */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Explanation</h4>
                    <p className="text-sm">{currentIssue.explanation}</p>
                  </div>
                  
                  {/* Regulation */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Regulation Reference</h4>
                    <p className="text-sm font-medium">{currentIssue.regulation}</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      {COMPLIANCE_REGULATIONS[currentIssue.regulation as keyof typeof COMPLIANCE_REGULATIONS] || 
                        "Regulation details not available"}
                    </div>
                  </div>
                  
                  {/* Original Text */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Original Text</h4>
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      {currentIssue.text}
                    </div>
                  </div>
                  
                  {/* Suggested Edit */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">AI Suggested Edit</h4>
                    <div className="p-3 bg-blue-50 rounded text-sm">
                      {currentIssue.suggestedEdit}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => handleIssueAction(currentIssue.id, 'accept')}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                    >
                      <FiCheck className="mr-2" /> Accept Issue
                    </button>
                    <button
                      onClick={() => handleIssueAction(currentIssue.id, 'reject')}
                      className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                    >
                      <FiX className="mr-2" /> Reject Issue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  {issues.length === 0 
                    ? "No compliance issues found in this document." 
                    : "Select an issue to view details."}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Legend for highlights */}
        {issues.length > 0 && (
          <div className="p-3 border-t bg-gray-50 flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-red-200"></span>
              <span>High Confidence Issue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-yellow-200"></span>
              <span>Low Confidence Issue</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
