import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects, getMyRecords } from '../../api/staff.api';
import { useAuth } from '../../context/AuthContext';
import StaffEmptyState from '../../components/staff/StaffEmptyState';
import StaffErrorState from '../../components/staff/StaffErrorState';
import StaffLoadingState from '../../components/staff/StaffLoadingState';
import StaffRecordCard from '../../components/staff/StaffRecordCard';
import './StaffPages.css';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsResponse, recordsResponse] = await Promise.all([
        getMyProjects(),
        getMyRecords(),
      ]);
      setProjects(projectsResponse.data || []);
      setRecords(recordsResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el panel del equipo pedagogico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => ({
    projects: projects.length,
    records: records.length,
    pending: records.filter((record) => record.status === 'PENDING_REVIEW').length,
    published: records.filter((record) => record.status === 'PUBLISHED').length,
  }), [projects, records]);

  const latestRecords = useMemo(() => records.slice(0, 4), [records]);
  const createLink = projects.length === 1
    ? `/staff/proyectos/${projects[0].id}/registros/nuevo`
    : '/staff/proyectos';

  if (loading) return <StaffLoadingState label="Cargando panel..." />;
  if (error) return <StaffErrorState message={error} onRetry={loadDashboard} />;

  return (
    <section className="page-container staff-page">
      <div className="staff-hero">
        <div>
          <p className="staff-kicker">Equipo pedagogico</p>
          <h1 className="page-title">Hola, {user?.name || user?.email}</h1>
          <p className="staff-page-copy">
            Desde aca podes consultar tus proyectos asignados, cargar registros y seguir su estado de revision.
          </p>
        </div>
        <div className="staff-actions">
          <Link className="btn btn-primary" to={createLink}>
            Crear registro
          </Link>
          <Link className="btn btn-ghost" to="/staff/registros">
            Mis registros
          </Link>
        </div>
      </div>

      <div className="staff-metric-grid">
        <article className="staff-metric-card">
          <span>Proyectos asignados</span>
          <strong>{stats.projects}</strong>
        </article>
        <article className="staff-metric-card">
          <span>Registros cargados</span>
          <strong>{stats.records}</strong>
        </article>
        <article className="staff-metric-card">
          <span>Pendientes</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="staff-metric-card">
          <span>Publicados</span>
          <strong>{stats.published}</strong>
        </article>
      </div>

      <div className="staff-section-header">
        <div>
          <h2>Accesos rapidos</h2>
          <p>Entradas principales para el trabajo cotidiano.</p>
        </div>
      </div>
      <div className="staff-quick-grid">
        <Link className="staff-quick-link" to="/staff/proyectos">
          <strong>Mis proyectos</strong>
          <span>Ver propuestas asignadas</span>
        </Link>
        <Link className="staff-quick-link" to="/staff/registros">
          <strong>Mis registros</strong>
          <span>Seguir estados de revision</span>
        </Link>
        <Link className="staff-quick-link" to={createLink}>
          <strong>Crear registro</strong>
          <span>{projects.length ? 'Elegir proyecto y cargar evidencia' : 'Requiere un proyecto asignado'}</span>
        </Link>
      </div>

      <div className="staff-section-header">
        <div>
          <h2>Ultimos registros</h2>
          <p>Movimientos recientes de tus proyectos.</p>
        </div>
        <Link className="btn btn-ghost btn-sm" to="/staff/registros">
          Ver todos
        </Link>
      </div>

      {latestRecords.length ? (
        <div className="staff-list">
          {latestRecords.map((record) => (
            <StaffRecordCard
              key={record.id}
              record={record}
              compact
              canEdit={record.createdBy === user?.id && record.status !== 'PUBLISHED'}
            />
          ))}
        </div>
      ) : (
        <StaffEmptyState
          title="Todavia no hay registros"
          message={projects.length ? 'Crea el primer registro desde uno de tus proyectos asignados.' : 'Cuando tengas proyectos asignados vas a poder cargar registros.'}
          action={<Link className="btn btn-ghost btn-sm" to="/staff/proyectos">Ir a proyectos</Link>}
        />
      )}
    </section>
  );
}
