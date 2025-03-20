import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { AuditPage } from './pages/AuditPage';
import { Inputs } from './pages/Inputs';
import AgentMock from './pages/AgentMock';

// Wrapper component to conditionally render the footer
const AppContent = () => {
  const location = useLocation();
  const isAuditPage = location.pathname === '/audit';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inputs" element={<Inputs />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/agent" element={<AgentMock />} />
        </Routes>
      </div>
      {/* 
        Only render the Footer if not on the AuditPage
        Note: AuditPage has its own footer implementation to avoid scrolling issues
        that occur when using the global footer with the complex scrollable content
        in the AuditPage component.
      */}
      {!isAuditPage && <Footer />}
    </div>
  );
};

function App() {  
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;