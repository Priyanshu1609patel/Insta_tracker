import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Reels from './pages/Reels';
import AdminPanel from './pages/AdminPanel';
import CreatorUsers from './pages/CreatorUsers';
import ClientPortal from './pages/ClientPortal';

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a' }}>
    <div style={{
      width: '40px', height: '40px',
      border: '3px solid rgba(225,48,108,0.2)',
      borderTopColor: '#E1306C',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
  </div>
);

// Home path per role
function rolePath(role) {
  if (role === 'admin')       return '/admin';
  if (role === 'client_user') return '/client-portal';
  return '/dashboard';
}

// Admin only
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to={rolePath(user.role)} replace />;
  return children;
}

// Creator only
function CreatorRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'creator') return <Navigate to={rolePath(user.role)} replace />;
  return children;
}

// Client user only
function ClientUserRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'client_user') return <Navigate to={rolePath(user.role)} replace />;
  return children;
}

// Redirect logged-in users to their role home
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  return <Navigate to={rolePath(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

          {/* Creator */}
          <Route path="/dashboard"   element={<CreatorRoute><Dashboard /></CreatorRoute>} />
          <Route path="/clients"     element={<CreatorRoute><Clients /></CreatorRoute>} />
          <Route path="/clients/:id" element={<CreatorRoute><ClientDetail /></CreatorRoute>} />
          <Route path="/reels"       element={<CreatorRoute><Reels /></CreatorRoute>} />
          <Route path="/users"       element={<CreatorRoute><CreatorUsers /></CreatorRoute>} />

          {/* Client user portal */}
          <Route path="/client-portal" element={<ClientUserRoute><ClientPortal /></ClientUserRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
