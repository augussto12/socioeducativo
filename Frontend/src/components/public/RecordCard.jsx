import { Link } from 'react-router-dom';

const typeLabels = {
  ACTIVITY: 'Actividad',
  EVIDENCE: 'Evidencia',
  PLANNING: 'Planificacion',
  REFLECTION: 'Reflexion',
  EVALUATION: 'Evaluacion',
  OTHER: 'Otro',
};

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function RecordCard({ record, showProject = false }) {
  return (
    <article className="record-card">
      <div className="public-meta-row">
        <span className="public-chip">{typeLabels[record.type] || record.type}</span>
        {record.recordDate && <span className="public-date">{formatDate(record.recordDate)}</span>}
      </div>

      <h3>{record.title}</h3>
      {showProject && record.project?.name && <p className="record-project">{record.project.name}</p>}
      {record.description && <p>{record.description}</p>}

      <div className="record-card-footer">
        <span>{record.files?.length || 0} archivos publicos</span>
        <Link className="public-text-link" to={`/registros/${record.id}`}>
          Ver registro
        </Link>
      </div>
    </article>
  );
}
