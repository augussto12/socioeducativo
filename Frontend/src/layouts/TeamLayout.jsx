import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TeamLayout.css';

export default function TeamLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="team-layout">
      <header className="team-topbar">
        <div className="team-topbar-inner">
          <div className="team-topbar-brand">
            <span className="team-topbar-emoji">🏆</span>
            <div>
              <span className="team-topbar-title">SocioEduca</span>
              <span className="team-topbar-sub">Torneos</span>
            </div>
          </div>
          <div className="team-topbar-right">
            <div className="team-topbar-avatar">
              {user?.team?.name?.substring(0, 2)?.toUpperCase() || '⭐'}
            </div>
            <div className="team-topbar-user">
              <span className="team-topbar-name">{user?.team?.name || user?.username}</span>
              <button className="team-logout-btn" onClick={handleLogout}>
                👋 Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="team-content">
        <Outlet />
      </main>

      <footer className="team-footer">
        <span>⚡ Hecho con 💜 para los futuros campeones</span>
      </footer>
    </div>
  );
}
