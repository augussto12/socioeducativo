import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

/**
 * AdminLayout — Mobile: topbar + hamburger drawer. Desktop: fixed sidebar.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/teams', label: 'Equipos', icon: '🛡️' },
    { to: '/admin/game-types', label: 'Juegos', icon: '🎮' },
    { to: '/admin/tournaments', label: 'Torneos', icon: '🏆' },
  ];

  return (
    <div className="admin-layout">
      {/* ─── Mobile Topbar ─────────────────────────────── */}
      <header className="admin-topbar" role="banner">
        <button
          className="hamburger-btn"
          onClick={toggleDrawer}
          aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={drawerOpen}
          aria-controls="admin-drawer"
        >
          <span className={`hamburger-line ${drawerOpen ? 'open' : ''}`} aria-hidden="true" />
        </button>
        <span className="admin-topbar-title">
          <span aria-hidden="true">🏆</span> SocioEduca
        </span>
        <div className="admin-topbar-user">
          <span className="admin-topbar-avatar" aria-hidden="true">👤</span>
        </div>
      </header>

      {/* ─── Drawer Overlay ────────────────────────────── */}
      {drawerOpen && (
        <div
          className="drawer-overlay"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar / Drawer ──────────────────────────── */}
      <aside
        id="admin-drawer"
        className={`admin-sidebar ${drawerOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Navegación administrativa"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo" aria-hidden="true">🏆</div>
          <h2 className="sidebar-title">SocioEduca</h2>
          <span className="sidebar-subtitle">Panel Admin</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeDrawer}
            >
              <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar" aria-hidden="true">👤</div>
            <div>
              <div className="sidebar-user-name">{user?.username}</div>
              <div className="sidebar-user-role">Administrador</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-block"
            onClick={handleLogout}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────────────── */}
      <main className="admin-main" id="main-content" role="main">
        <Outlet />
      </main>
    </div>
  );
}
