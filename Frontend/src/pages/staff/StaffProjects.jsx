import { useEffect, useState } from 'react';
import { getMyProjects } from '../../api/staff.api';
import StaffEmptyState from '../../components/staff/StaffEmptyState';
import StaffErrorState from '../../components/staff/StaffErrorState';
import StaffLoadingState from '../../components/staff/StaffLoadingState';
import StaffProjectCard from '../../components/staff/StaffProjectCard';
import './StaffPages.css';

export default function StaffProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMyProjects();
      setProjects(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar tus proyectos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) return <StaffLoadingState label="Cargando proyectos..." />;
  if (error) return <StaffErrorState message={error} onRetry={loadProjects} />;

  return (
    <section className="page-container staff-page">
      <div className="staff-hero">
        <div>
          <p className="staff-kicker">Proyectos asignados</p>
          <h1 className="page-title">Mis proyectos</h1>
          <p className="staff-page-copy">
            Solo se muestran proyectos donde formas parte del equipo asignado.
          </p>
        </div>
      </div>

      {projects.length ? (
        <div className="staff-project-grid">
          {projects.map((project) => (
            <StaffProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <StaffEmptyState
          title="No tenes proyectos asignados"
          message="Cuando el administrador te asigne a un proyecto, lo vas a ver en este panel."
        />
      )}
    </section>
  );
}
