import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AuditPage } from './pages/AuditPage';
import AgentMock from './pages/AgentMock';

function App() {  

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/agent" element={<AgentMock />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;