import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { to: '/staff', label: 'Inicio', icon: 'IN', end: true },
  { to: '/staff/proyectos', label: 'Proyectos', icon: 'PR' },
  { to: '/staff/registros', label: 'Registros', icon: 'RG' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegacion del equipo pedagogico">
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
