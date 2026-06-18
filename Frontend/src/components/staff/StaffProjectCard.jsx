import { Link } from 'react-router-dom';
import StaffStatusBadge from './StaffStatusBadge';
import './StaffComponents.css';

export default function StaffProjectCard({ project }) {
  const recordsCount = project?._count?.records ?? project?.records?.length ?? 0;

  return (
    <article className="staff-project-card">
      <div className="staff-card-header">
        <div>
          <p className="staff-kicker">{project.category?.name || 'Sin categoria'}</p>
          <h2>{project.name}</h2>
        </div>
        <div className="staff-badge-row">
          <StaffStatusBadge value={project.status} />
          <StaffStatusBadge value={project.visibility} />
        </div>
      </div>

      <p className="staff-card-copy">{project.description}</p>

      <dl className="staff-card-meta">
        <div>
          <dt>Duracion</dt>
          <dd>{project.duration || 'No indicada'}</dd>
        </div>
        <div>
          <dt>Registros</dt>
          <dd>{recordsCount}</dd>
        </div>
        {project.roleInProject && (
          <div>
            <dt>Rol</dt>
            <dd>{project.roleInProject}</dd>
          </div>
        )}
      </dl>

      <div className="staff-card-actions">
        <Link className="btn btn-primary btn-sm" to={`/staff/proyectos/${project.id}`}>
          Ver proyecto
        </Link>
        <Link className="btn btn-ghost btn-sm" to={`/staff/proyectos/${project.id}/registros/nuevo`}>
          Crear registro
        </Link>
      </div>
    </article>
  );
}
