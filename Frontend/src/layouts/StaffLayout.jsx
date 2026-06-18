import { useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import './StaffLayout.css';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const navItems = [
    { to: '/staff', label: 'Inicio', end: true },
    { to: '/staff/proyectos', label: 'Mis proyectos' },
    { to: '/staff/registros', label: 'Registros' },
  ];

  return (
    <div className="staff-layout">
      <header className="staff-topbar" role="banner">
        <div className="staff-topbar-inner">
          <div className="staff-brand">
            <span className="staff-brand-mark" aria-hidden="true">SE</span>
            <div>
              <span className="staff-title">SocioEduca</span>
              <span className="staff-subtitle">Equipo pedagogico</span>
            </div>
          </div>

          <nav className="staff-desktop-nav" role="navigation" aria-label="Navegacion del equipo pedagogico">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `staff-desktop-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="staff-user">
            <span className="staff-user-name">{user?.name || user?.email}</span>
            <button className="staff-logout-btn" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="staff-content" id="main-content" role="main">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
