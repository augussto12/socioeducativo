import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/public/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import TeamLayout from './layouts/TeamLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeams from './pages/admin/AdminTeams';
import AdminGameTypes from './pages/admin/AdminGameTypes';
import AdminTournaments from './pages/admin/AdminTournaments';
import AdminMatches from './pages/admin/AdminMatches';
import TeamDashboard from './pages/team/TeamDashboard';
import TournamentDetailPage from './pages/public/TournamentDetailPage';
import './index.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/team'} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/team'} replace /> : <LoginPage />
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="game-types" element={<AdminGameTypes />} />
        <Route path="tournaments" element={<AdminTournaments />} />
        <Route path="tournaments/:id" element={<AdminMatches />} />
      </Route>

      {/* Team Routes */}
      <Route path="/team" element={
        <ProtectedRoute allowedRoles={['TEAM']}><TeamLayout /></ProtectedRoute>
      }>
        <Route index element={<TeamDashboard />} />
      </Route>

      {/* Public Tournament View */}
      <Route path="/tournament/:id" element={<TournamentDetailPage />} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
