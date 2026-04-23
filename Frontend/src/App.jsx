import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SkeletonLoader from './components/SkeletonLoader';

/* ─── Lazy-loaded Pages (code-split per route) ───────────── */
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const TournamentDetailPage = lazy(() => import('./pages/public/TournamentDetailPage'));

const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTeams = lazy(() => import('./pages/admin/AdminTeams'));
const AdminGameTypes = lazy(() => import('./pages/admin/AdminGameTypes'));
const AdminTournaments = lazy(() => import('./pages/admin/AdminTournaments'));
const AdminMatches = lazy(() => import('./pages/admin/AdminMatches'));

const TeamLayout = lazy(() => import('./layouts/TeamLayout'));
const TeamDashboard = lazy(() => import('./pages/team/TeamDashboard'));
const TeamStandings = lazy(() => import('./pages/team/TeamStandings'));
const TeamTournaments = lazy(() => import('./pages/team/TeamTournaments'));
const TeamProfile = lazy(() => import('./pages/team/TeamProfile'));

/* ─── Loading Fallback ───────────────────────────────────── */
function PageFallback() {
  return <SkeletonLoader variant="full-page" />;
}

/* ─── Protected Route Wrappers ───────────────────────────── */
function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/team" replace />;
  return children;
}

function RequireTeam({ children }) {
  const { user, loading, isTeam } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isTeam) return <Navigate to="/admin" replace />;
  return children;
}

function RedirectIfAuth({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageFallback />;
  if (user) return <Navigate to={isAdmin ? '/admin' : '/team'} replace />;
  return children;
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a href="#main-content" className="skip-to-content">
          Saltar al contenido
        </a>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <RedirectIfAuth><LoginPage /></RedirectIfAuth>
            } />
            <Route path="/tournament/:id" element={<TournamentDetailPage />} />

            {/* Admin */}
            <Route path="/admin" element={
              <RequireAdmin><AdminLayout /></RequireAdmin>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="game-types" element={<AdminGameTypes />} />
              <Route path="tournaments" element={<AdminTournaments />} />
              <Route path="tournaments/:id" element={<AdminMatches />} />
            </Route>

            {/* Team */}
            <Route path="/team" element={
              <RequireTeam><TeamLayout /></RequireTeam>
            }>
              <Route index element={<TeamDashboard />} />
              <Route path="standings" element={<TeamStandings />} />
              <Route path="tournaments" element={<TeamTournaments />} />
              <Route path="profile" element={<TeamProfile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
