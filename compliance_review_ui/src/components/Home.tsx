import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BreadcrumbNav } from './BreadcrumbNav';
import { SimpleMockDocumentViewer } from './SimpleMockDocumentViewer';

interface HomeProps {
  selectedTrial: string;
}

export const Home: React.FC<HomeProps> = ({ 
  selectedTrial
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local state
  const [selectedDocument, setSelectedDocument] = useState<{ id: number; title: string } | null>(null);
  
  // Get document ID from the URL for the document view route
  const getDocumentIdFromPath = () => {
    const path = location.pathname;
    if (path.startsWith('/document/')) {
      const id = parseInt(path.split('/').pop() || '0', 10);
      return id || null;
    }
    return null;
  };
  
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
  
  // Handle document selection
  const handleDocumentSelect = (doc: { id: number; title: string }) => {
    setSelectedDocument(doc);
    navigate(`/document/${doc.id}`);
  };
  
  // Sync URL document ID with selectedDocument state
  useEffect(() => {
    const docId = getDocumentIdFromPath();
    
    if (docId) {
      // If there's a document ID in the URL but no selected document (or different one)
      if (!selectedDocument || selectedDocument.id !== docId) {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          setSelectedDocument({id: doc.id, title: doc.title});
        }
      }
    } else if (location.pathname === '/' && selectedDocument) {
      // If we're on the home route but still have a selected document
      setSelectedDocument(null);
    }
  }, [location.pathname, selectedDocument]);

  // Get current document ID
  const docId = getDocumentIdFromPath();

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
                  onClick={() => handleDocumentSelect({id: doc.id, title: doc.title})}
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