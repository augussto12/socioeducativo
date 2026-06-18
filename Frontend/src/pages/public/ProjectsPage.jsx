import { useEffect, useState } from 'react';
import { getPublicProjects } from '../../api/projects.api';
import ProjectCard from '../../components/public/ProjectCard';
import LoadingState from '../../components/public/LoadingState';
import ErrorState from '../../components/public/ErrorState';
import EmptyState from '../../components/public/EmptyState';
import './PublicPages.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setLoading(true);
      setError('');

      try {
        const { data } = await getPublicProjects();
        if (active) setProjects(data || []);
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'No se pudieron cargar los proyectos.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="public-page" id="main-content">
      <section className="public-page-heading">
        <span className="public-eyebrow">Proyectos pedagogicos</span>
        <h1>Propuestas publicas del centro</h1>
        <p>Conoce los proyectos disponibles, sus contenidos, metodologias y registros publicados.</p>
      </section>

      {loading && <LoadingState label="Cargando proyectos..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && projects.length === 0 && (
        <EmptyState
          title="No hay proyectos publicos"
          message="El equipo todavia no publico proyectos para mostrar en el sitio."
        />
      )}
      {!loading && !error && projects.length > 0 && (
        <section className="public-card-grid" aria-label="Listado de proyectos publicos">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      )}
    </main>
  );
}
