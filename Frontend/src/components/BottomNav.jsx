/**
 * BottomNav — Fixed bottom navigation for team dashboard (mobile only).
 * Shows 4 routes with active state based on current location.
 * Hidden on desktop via CSS.
 */
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { to: '/team', label: 'Inicio', icon: '🏠', end: true },
  { to: '/team/standings', label: 'Posiciones', icon: '📊' },
  { to: '/team/tournaments', label: 'Torneos', icon: '🏆' },
  { to: '/team/profile', label: 'Perfil', icon: '👤' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegación principal del equipo">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
