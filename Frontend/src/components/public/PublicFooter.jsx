import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-brand">
          <span className="public-footer-mark" aria-hidden="true">CS</span>
          <div>
            <strong>Centros Socioeducativos</strong>
            <p>Espacios de cuidado, acompanamiento pedagogico, participacion comunitaria y proyectos integrales.</p>
          </div>
        </div>
        <nav className="public-footer-links" aria-label="Links principales">
          <Link to="/">Inicio</Link>
          <Link to="/quienes-somos">Quienes somos</Link>
          <Link to="/proyectos">Proyectos</Link>
          <Link to="/login">Ingresar</Link>
        </nav>
      </div>
    </footer>
  );
}
