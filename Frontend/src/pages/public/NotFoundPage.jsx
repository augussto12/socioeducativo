import { Link } from 'react-router-dom';
import './PublicPages.css';

export default function NotFoundPage({
  title = 'Pagina no encontrada',
  message = 'La direccion que buscabas no esta disponible.',
}) {
  return (
    <main className="public-page" id="main-content">
      <section className="public-not-found">
        <span className="public-eyebrow">404</span>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="public-actions">
          <Link className="public-primary-action" to="/">Ir al inicio</Link>
          <Link className="public-secondary-action" to="/proyectos">Ver proyectos</Link>
        </div>
      </section>
    </main>
  );
}
