import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Dashboard } from "./pages/Dashboard";
import { Inputs } from "./pages/Inputs";
import { AuditPage } from "./pages/AuditPage";
import AgentMock from "./pages/AgentMock";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Wrapper component to conditionally render the Navbar and Footer
const AppContent = () => {
  const location = useLocation();
  const isAuditPage = location.pathname === '/audit';
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {!isLoginPage && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/inputs" element={
            <ProtectedRoute>
              <Inputs />
            </ProtectedRoute>
          } />
          
          <Route path="/audit" element={
            <ProtectedRoute>
              <AuditPage />
            </ProtectedRoute>
          } />
          
          <Route path="/agent" element={
            <ProtectedRoute>
              <AgentMock />
            </ProtectedRoute>
          } />
          
          {/* Redirect to dashboard if logged in, otherwise to login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      {/* 
        Only render the Footer if not on the AuditPage or LoginPage
        Note: AuditPage has its own footer implementation to avoid scrolling issues
        that occur when using the global footer with the complex scrollable content
        in the AuditPage component.
      */}
      {!isAuditPage && !isLoginPage && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;