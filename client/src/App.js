import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import BettingAnalyzer from './pages/BettingAnalyzer';
import FantasyOptimizer from './pages/FantasyOptimizer';
import GameStrategy from './pages/GameStrategy';
import EsportsTracker from './pages/EsportsTracker';
import RefereeAssistant from './pages/RefereeAssistant';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Favorites from './pages/Favorites';
import FeedbackPage from './pages/FeedbackPage';
import AuditLog from './pages/AuditLog';
import ContactSupport from './pages/ContactSupport';
import AdminPanel from './pages/AdminPanel';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SearchPage from './pages/SearchPage';
import DataExport from './pages/DataExport';
import FileUpload from './pages/FileUpload';
import ChartsPage from './pages/ChartsPage';
import Onboarding from './pages/Onboarding';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/*"
              element={
                isAuthenticated ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/betting/*" element={<BettingAnalyzer />} />
                      <Route path="/fantasy/*" element={<FantasyOptimizer />} />
                      <Route path="/strategy/*" element={<GameStrategy />} />
                      <Route path="/esports/*" element={<EsportsTracker />} />
                      <Route path="/referee/*" element={<RefereeAssistant />} />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/favorites" element={<Favorites />} />
                      <Route path="/feedback" element={<FeedbackPage />} />
                      <Route path="/audit" element={<AuditLog />} />
                      <Route path="/contact" element={<ContactSupport />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/export" element={<DataExport />} />
                      <Route path="/uploads" element={<FileUpload />} />
                      <Route path="/charts" element={<ChartsPage />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
