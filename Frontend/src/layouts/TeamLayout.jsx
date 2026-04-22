/**
 * TeamLayout — Layout wrapper for team-facing pages.
 * Mobile: topbar + bottom navigation. Desktop: topbar + horizontal nav.
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import './TeamLayout.css';

export default function TeamLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const desktopNavItems = [
    { to: '/team', label: 'Inicio', icon: '🏠', end: true },
    { to: '/team/standings', label: 'Posiciones', icon: '📊' },
    { to: '/team/tournaments', label: 'Torneos', icon: '🏆' },
    { to: '/team/profile', label: 'Perfil', icon: '👤' },
  ];

  return (
    <div className="team-layout">
      {/* Background effects */}
      <div className="team-bg-effects" aria-hidden="true" />

      {/* ─── Top Bar ─────────────────────────────────── */}
      <header className="team-topbar" role="banner">
        <div className="team-topbar-inner">
          <div className="team-topbar-brand">
            <span className="team-topbar-emoji" aria-hidden="true">🏆</span>
            <div>
              <span className="team-topbar-title">SocioEduca</span>
              <span className="team-topbar-sub">Torneos</span>
            </div>
          </div>

          {/* Desktop nav links */}
          <nav className="team-desktop-nav" role="navigation" aria-label="Navegación del equipo">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `team-desktop-link ${isActive ? 'active' : ''}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="team-topbar-right">
            <div className="team-topbar-avatar" aria-hidden="true">
              {user?.team?.name?.substring(0, 2)?.toUpperCase() || '⭐'}
            </div>
            <div className="team-topbar-user">
              <span className="team-topbar-name">{user?.team?.name || user?.username}</span>
              <button
                className="team-logout-btn"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              >
                <span aria-hidden="true">👋</span> Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────── */}
      <main className="team-content" id="main-content" role="main">
        <Outlet />
      </main>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="team-footer" role="contentinfo">
        <span>⚡ Hecho con 💜 para los futuros campeones</span>
      </footer>

      {/* ─── Bottom Nav (mobile only, hidden via CSS on desktop) ── */}
      <BottomNav />
    </div>
  );
}
