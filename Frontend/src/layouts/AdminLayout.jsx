import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: 'Inicio', end: true },
    { to: '/admin/contenido', label: 'Contenido', icon: 'CMS' },
    { to: '/admin/proyectos', label: 'Proyectos', icon: 'PR' },
    { to: '/admin/registros', label: 'Registros', icon: 'RG' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: 'US' },
    { to: '/admin/auditoria', label: 'Auditoria', icon: 'AU' },
  ];

  return (
    <div className="admin-layout">
      <header className="admin-topbar" role="banner">
        <button
          className="hamburger-btn"
          onClick={() => setDrawerOpen((open) => !open)}
          aria-label={drawerOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={drawerOpen}
          aria-controls="admin-drawer"
        >
          <span className={`hamburger-line ${drawerOpen ? 'open' : ''}`} aria-hidden="true" />
        </button>
        <span className="admin-topbar-title">SocioEduca Admin</span>
        <div className="admin-topbar-user">
          <span className="admin-topbar-avatar" aria-hidden="true">AD</span>
        </div>
      </header>

      {drawerOpen && (
        <div
          className="drawer-overlay"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-drawer"
        className={`admin-sidebar ${drawerOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Navegacion administrativa"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo" aria-hidden="true">SE</div>
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
            <div className="sidebar-user-avatar" aria-hidden="true">AD</div>
            <div>
              <div className="sidebar-user-name">{user?.name || user?.email}</div>
              <div className="sidebar-user-role">Administrador</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-block"
            onClick={handleLogout}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="admin-main" id="main-content" role="main">
        <Outlet />
      </main>
    </div>
  );
}
