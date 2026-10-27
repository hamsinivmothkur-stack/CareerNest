import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Pipeline from './pages/Pipeline';
import Deadlines from './pages/Deadlines';
import Login from './pages/Login';
import Register from './pages/Register';
import ApplicationModal from './components/ApplicationModal';

// Route Guard for authenticated users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-muted)',
        }}
      >
        Initializing CareerNest session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Guard for anonymous users (Login / Register)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main Authenticated Layout
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalAddOpen, setIsGlobalAddOpen] = useState(false);
  const location = useLocation();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard', subtitle: 'Internship recruitment summary & progress' };
      case '/applications':
        return { title: 'Applications', subtitle: 'Search, filter, and organize all opportunities' };
      case '/pipeline':
        return { title: 'Pipeline Board', subtitle: 'Visual Kanban workflow by stage' };
      case '/deadlines':
        return { title: 'Deadlines & Calendar', subtitle: 'Cutoffs, upcoming assessments, and interviews' };
      default:
        return { title: 'CareerNest', subtitle: 'Internship Application Tracker' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAddModal={() => setIsGlobalAddOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/deadlines" element={<Deadlines />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Global Add Application Modal */}
      <ApplicationModal
        isOpen={isGlobalAddOpen}
        onClose={() => setIsGlobalAddOpen(false)}
        onSuccess={() => {
          // Trigger a refresh event so active views re-fetch
          window.dispatchEvent(new Event('application-updated'));
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
