import { NavLink, Link } from 'react-router-dom';

export default function PublicNavbar() {
  return (
    <header className="public-nav" role="banner">
      <div className="public-nav-inner">
        <Link className="public-brand" to="/" aria-label="Ir al inicio">
          <span className="public-brand-mark" aria-hidden="true">
            <span>CS</span>
          </span>
          <span className="public-brand-copy">
            <strong>Centros Socioeducativos</strong>
            <small>Barrios Populares</small>
          </span>
        </Link>

        <nav className="public-links" aria-label="Navegacion publica">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/quienes-somos">Quienes somos</NavLink>
          <NavLink to="/proyectos">Proyectos pedagogicos</NavLink>
          <NavLink className="public-login-link" to="/login">Ingresar</NavLink>
        </nav>
      </div>
    </header>
  );
}
