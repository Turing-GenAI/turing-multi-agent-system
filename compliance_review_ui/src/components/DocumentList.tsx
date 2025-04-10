import { useState, useEffect } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { FiCheck } from 'react-icons/fi'
import { DocumentDetails } from './DocumentDetails'
import { documentAPI } from '../services/api'

// Define empty warnings array for now - in a real app, these would come from the backend API
const emptyWarnings: any[] = []

interface DocumentListProps {
  onDocumentSelect: (doc: { id: number; title: string }) => void;
  selectedDocument: { id: number; title: string } | null;
}

interface Document {
  id: string;
  title: string;
  type: string;
  format?: string;
  created?: string;
  updated?: string;
  content?: string;
  warnings?: number;
}

export function DocumentList({ onDocumentSelect, selectedDocument }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch documents from the backend API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const docs = await documentAPI.getDocuments()
        
        // Transform the backend document format to match our component's needs
        const formattedDocs = docs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          format: doc.filename ? doc.filename.split('.').pop().toUpperCase() : 'TXT',
          created: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          updated: '2 days ago', // This would ideally come from the backend
          warnings: Math.floor(Math.random() * 3) // Placeholder until we have real warnings data
        }))
        
        setDocuments(formattedDocs)
        setError(null)
      } catch (err) {
        console.error('Error fetching documents:', err)
        setError('Failed to load documents. Please try again.')
        // Fallback to empty array if API fails
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchDocuments()
  }, [])

  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [activeDocument, setActiveDocument] = useState<Document | null>(null)

  // Fetch document content when a document is selected
  const handleDocumentClick = async (doc: Document) => {
    try {
      // Only fetch content if we have a valid document ID
      if (doc.id) {
        setLoading(true);
        const content = await documentAPI.getDocumentContent(doc.id);
        const docWithContent = {
          ...doc,
          content: content
        };
        setActiveDocument(docWithContent);
        onDocumentSelect({id: Number(doc.id), title: doc.title});
      }
    } catch (err) {
      console.error('Error fetching document content:', err);
      // Still set the active document even if content fetch fails
      setActiveDocument(doc);
      onDocumentSelect({id: Number(doc.id), title: doc.title});
    } finally {
      setLoading(false);
    }
  };

  if (activeDocument) {
    return (
      <DocumentDetails 
        document={{
          ...activeDocument,
          warnings: emptyWarnings
        }}
        onClose={() => {
          setActiveDocument(null);
          onDocumentSelect({ id: 0, title: '' });
        }}
      />
    )
  }

  return (
    <div className="mt-8">
      {loading && documents.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No documents found.</p>
        </div>
      ) : (
      <>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="pb-4 font-normal">
                <Checkbox.Root
                  className="flex h-4 w-4 items-center justify-center rounded border border-gray-300"
                  checked={selectedDocs.length === documents.length}
                  onCheckedChange={(checked) => {
                    setSelectedDocs(checked ? documents.map(d => d.id) : [])
                  }}
                >
                  <Checkbox.Indicator>
                    <FiCheck className="h-3 w-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </th>
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
                onClick={() => handleDocumentClick(doc)}
              >
                <td className="py-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox.Root
                    className="flex h-4 w-4 items-center justify-center rounded border border-gray-300"
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={(checked) => {
                      setSelectedDocs(
                        checked
                          ? [...selectedDocs, doc.id]
                          : selectedDocs.filter(id => id !== doc.id)
                      )
                    }}
                  >
                    <Checkbox.Indicator>
                      <FiCheck className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </td>
                <td className="py-4">{doc.id}</td>
                <td className="py-4">{doc.title}</td>
                <td className="py-4">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-warning/10 rounded-full text-warning">
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
              Page 1 of {Math.max(1, Math.ceil(documents.length / 10))}
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  )
}