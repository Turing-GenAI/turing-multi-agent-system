import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Navigation } from './components/Navigation'
import { Home } from './components/Home'
import { ComplianceContainer } from './components/ComplianceContainer'
import { Settings } from './components/Settings'
import { InformationCollection } from './components/InformationCollection'
import AnalyticsDashboard from './components/AnalyticsDashboard'

function App() {
  // Router hooks
  const navigate = useNavigate()
  const location = useLocation()
  
  // Trial selection state
  const [selectedTrial] = useState('Phase III Study of Drug X for Lung Cancer')
  
  // Get current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname
    if (path.startsWith('/compliance')) return 'compliance'
    if (path.startsWith('/analytics')) return 'analytics'
    if (path.startsWith('/information')) return 'information'
    if (path.startsWith('/settings')) return 'settings'
    return 'home'
  }

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
  }

  return (
    <div className="flex h-screen bg-white">
      <Navigation activeTab={getCurrentTab()} onTabChange={handleTabChange} />
      {getCurrentTab() === 'home' && <Sidebar selectedTrial={selectedTrial} />}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <Routes>
            <Route path="/" element={<Home selectedTrial={selectedTrial} />} />
            <Route path="/document/:id" element={<Home selectedTrial={selectedTrial} />} />
            <Route path="/compliance" element={<ComplianceContainer />} />
            <Route path="/compliance/review/:reviewId" element={<ComplianceContainer />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/information" element={
              <InformationCollection 
                onInformationSubmit={(info) => console.log('Information submitted:', info)} 
              />
            } />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App