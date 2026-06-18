import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SkeletonLoader from './components/SkeletonLoader';

const HomePage = lazy(() => import('./pages/public/HomePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ProjectsPage = lazy(() => import('./pages/public/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/public/ProjectDetailPage'));
const RecordDetailPage = lazy(() => import('./pages/public/RecordDetailPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const ChangePasswordPage = lazy(() => import('./pages/public/ChangePasswordPage'));
const PublicLayout = lazy(() => import('./components/public/PublicLayout'));

const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminSiteContent = lazy(() => import('./pages/admin/AdminSiteContent'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));
const AdminProjectMembers = lazy(() => import('./pages/admin/AdminProjectMembers'));
const AdminRecords = lazy(() => import('./pages/admin/AdminRecords'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));

const StaffLayout = lazy(() => import('./layouts/StaffLayout'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StaffProjects = lazy(() => import('./pages/staff/StaffProjects'));
const StaffProjectDetail = lazy(() => import('./pages/staff/StaffProjectDetail'));
const StaffRecords = lazy(() => import('./pages/staff/StaffRecords'));
const StaffRecordCreate = lazy(() => import('./pages/staff/StaffRecordCreate'));
const StaffRecordDetail = lazy(() => import('./pages/staff/StaffRecordDetail'));

function PageFallback() {
  return <SkeletonLoader variant="full-page" />;
}

function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAdmin) return <Navigate to="/staff" replace />;
  return children;
}

function RequireStaff({ children }) {
  const { user, loading, isStaff, isAdmin } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isStaff && !isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfAuth({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageFallback />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user) return <Navigate to={isAdmin ? '/admin' : '/staff'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a href="#main-content" className="skip-to-content">
          Saltar al contenido
        </a>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="quienes-somos" element={<AboutPage />} />
              <Route path="proyectos" element={<ProjectsPage />} />
              <Route path="proyectos/:slug" element={<ProjectDetailPage />} />
              <Route path="registros/:id" element={<RecordDetailPage />} />
              <Route path="404" element={<NotFoundPage />} />
            </Route>
            <Route
              path="/login"
              element={
                <RedirectIfAuth>
                  <LoginPage />
                </RedirectIfAuth>
              }
            />
            <Route
              path="/change-password"
              element={
                <RequireAuth>
                  <ChangePasswordPage />
                </RequireAuth>
              }
            />

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="contenido" element={<AdminSiteContent />} />
              <Route path="proyectos" element={<AdminProjects />} />
              <Route path="proyectos/:id/miembros" element={<AdminProjectMembers />} />
              <Route path="registros" element={<AdminRecords />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="auditoria" element={<AdminAuditLogs />} />
            </Route>

            <Route
              path="/staff"
              element={
                <RequireStaff>
                  <StaffLayout />
                </RequireStaff>
              }
            >
              <Route index element={<StaffDashboard />} />
              <Route path="proyectos" element={<StaffProjects />} />
              <Route path="proyectos/:id" element={<StaffProjectDetail />} />
              <Route path="proyectos/:projectId/registros/nuevo" element={<StaffRecordCreate />} />
              <Route path="registros" element={<StaffRecords />} />
              <Route path="registros/:id" element={<StaffRecordDetail />} />
            </Route>

            <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
