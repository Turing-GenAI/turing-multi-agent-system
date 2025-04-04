import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { DocumentList } from './components/DocumentList'
import { BreadcrumbNav } from './components/BreadcrumbNav'
import { Navigation } from './components/Navigation'

function App() {
  const [selectedTrial, setSelectedTrial] = useState('Phase III Study of Drug X for Lung Cancer')
  const [selectedDocument, setSelectedDocument] = useState<{ id: number; title: string } | null>(null)

  return (
    <div className="flex h-screen bg-white">
      <Navigation />
      <Sidebar selectedTrial={selectedTrial} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
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
            <DocumentList 
              onDocumentSelect={(doc) => setSelectedDocument({ id: doc.id, title: doc.title })}
              selectedDocument={selectedDocument}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App