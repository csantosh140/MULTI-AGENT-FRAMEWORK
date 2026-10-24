import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ThemeProvider } from './hooks/useTheme';
import { NotificationProvider } from './hooks/useNotification';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import AttackLogs from './pages/AttackLogs';
import ThreatAnalytics from './pages/ThreatAnalytics';
import BlockedRequests from './pages/BlockedRequests';
import AIDetection from './pages/AIDetection';
import PayloadGenerator from './pages/PayloadGenerator';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import AIDiagnostics from './pages/AIDiagnostics';
import AIAgents from './pages/AIAgents';
import VulnerableTarget from './pages/VulnerableTarget';
import ExternalSimulator from './pages/ExternalSimulator';
import MultiThreatScanner from './pages/MultiThreatScanner';

import './App.css';

// Route Protection with Auth Context Loading States
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-custom text-text-custom theme-transition">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-accent-custom border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Verifying Credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public/Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register" element={<Signup />} />
              </Route>

              {/* Protected Core App Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/live" element={<LiveMonitoring />} />
                <Route path="/logs" element={<AttackLogs />} />
                <Route path="/analytics" element={<ThreatAnalytics />} />
                <Route path="/blocked" element={<BlockedRequests />} />
                <Route path="/ai-detection" element={<AIDetection />} />
                <Route path="/generator" element={<PayloadGenerator />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/ai-diagnostics" element={<AIDiagnostics />} />
                <Route path="/ai-agents" element={<AIAgents />} />
                <Route path="/vulnerable-target" element={<VulnerableTarget />} />
                <Route path="/external-simulator" element={<ExternalSimulator />} />
                <Route path="/multi-threat" element={<MultiThreatScanner />} />
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Retro 404 access denied page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
