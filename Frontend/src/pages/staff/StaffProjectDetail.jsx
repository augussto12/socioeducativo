import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMyProject, getMyProjectRecords } from '../../api/staff.api';
import StaffEmptyState from '../../components/staff/StaffEmptyState';
import StaffErrorState from '../../components/staff/StaffErrorState';
import StaffLoadingState from '../../components/staff/StaffLoadingState';
import StaffRecordCard from '../../components/staff/StaffRecordCard';
import StaffStatusBadge from '../../components/staff/StaffStatusBadge';
import PaginationControls from '../../components/PaginationControls';
import { projectRecordCount } from './staffFormatters';
import './StaffPages.css';

const PAGE_SIZE = 25;

export default function StaffProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsPagination, setRecordsPagination] = useState(null);
  const [recordsPage, setRecordsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProject = async (pageToLoad = recordsPage) => {
    setLoading(true);
    setError('');
    try {
      const [projectResponse, recordsResponse] = await Promise.all([
        getMyProject(id),
        getMyProjectRecords(id, { page: pageToLoad, limit: PAGE_SIZE }),
      ]);
      setProject(projectResponse.data);
      setRecords(recordsResponse.data.items || recordsResponse.data || []);
      setRecordsPagination(recordsResponse.data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el proyecto asignado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject(recordsPage);
  }, [id, recordsPage]);

  if (loading) return <StaffLoadingState label="Cargando proyecto..." />;
  if (error) return <StaffErrorState message={error} onRetry={loadProject} />;
  if (!project) return <StaffEmptyState title="Proyecto no encontrado" message="No hay datos para mostrar." />;

  return (
    <section className="page-container staff-page">
      <div className="staff-detail-header">
        <div>
          <p className="staff-kicker">{project.category?.name || 'Sin categoria'}</p>
          <h1 className="page-title">{project.name}</h1>
          <p className="staff-page-copy">{project.description}</p>
          <div className="staff-badge-row">
            <StaffStatusBadge value={project.status} />
            <StaffStatusBadge value={project.visibility} />
          </div>
        </div>
        <div className="staff-actions">
          <Link className="btn btn-primary" to={`/staff/proyectos/${project.id}/registros/nuevo`}>
            Crear registro
          </Link>
          <Link className="btn btn-ghost" to="/staff/proyectos">
            Volver
          </Link>
        </div>
      </div>

      <div className="staff-detail-grid">
        <article className="staff-panel">
          <h2>Datos pedagogicos</h2>
          <dl className="staff-detail-list">
            <div>
              <dt>Duracion</dt>
              <dd>{project.duration || 'No indicada'}</dd>
            </div>
            <div>
              <dt>Contenidos curriculares</dt>
              <dd>{project.curricularContents || 'Sin contenido cargado'}</dd>
            </div>
            <div>
              <dt>Metodologia</dt>
              <dd>{project.methodology || 'Sin metodologia cargada'}</dd>
            </div>
            <div>
              <dt>Fundamento pedagogico</dt>
              <dd>{project.pedagogicalFoundation || 'Sin fundamento cargado'}</dd>
            </div>
          </dl>
        </article>

        <aside className="staff-panel">
          <h2>Resumen</h2>
          <dl className="staff-detail-list">
            <div>
              <dt>Registros</dt>
              <dd>{projectRecordCount(project)}</dd>
            </div>
            <div>
              <dt>Rol en el proyecto</dt>
              <dd>{project.roleInProject || 'Equipo pedagogico'}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="staff-section-header">
        <div>
          <h2>Registros del proyecto</h2>
          <p>Estados y evidencias asociadas a esta propuesta.</p>
        </div>
      </div>

      {records.length ? (
        <div className="staff-list">
          {records.map((record) => (
            <StaffRecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <StaffEmptyState
          title="Sin registros en este proyecto"
          message="Crea el primer registro para dejar constancia del trabajo realizado."
          action={<Link className="btn btn-primary btn-sm" to={`/staff/proyectos/${project.id}/registros/nuevo`}>Crear registro</Link>}
        />
      )}
      <PaginationControls pagination={recordsPagination} onPageChange={setRecordsPage} />
    </section>
  );
}
