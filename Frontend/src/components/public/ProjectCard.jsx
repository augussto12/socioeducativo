import { Link } from 'react-router-dom';

const statusLabels = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  FINISHED: 'Finalizado',
  DRAFT: 'Borrador',
  ARCHIVED: 'Archivado',
};

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ProjectCard({ project, featured = false }) {
  return (
    <article className={`project-card ${featured ? 'project-card-featured' : ''}`}>
      <span className="project-card-ribbon" aria-hidden="true" />
      {project.coverImageUrl ? (
        <img className="project-card-image" src={project.coverImageUrl} alt="" loading="lazy" />
      ) : (
        <div className="project-card-image project-card-placeholder" aria-hidden="true">
          {initials(project.name)}
        </div>
      )}

      <div className="project-card-body">
        <div className="public-meta-row">
          {project.category?.name && <span className="public-chip">{project.category.name}</span>}
          {project.status && <span className="public-chip public-chip-muted">{statusLabels[project.status] || project.status}</span>}
        </div>

        <h3>{project.name}</h3>
        <p>{project.description}</p>

        <div className="project-card-action">
          <Link className="public-text-link" to={`/proyectos/${project.slug}`}>
            Ver proyecto
          </Link>
        </div>
      </div>
    </article>
  );
}
