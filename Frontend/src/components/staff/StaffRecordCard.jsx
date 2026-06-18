import { Link } from 'react-router-dom';
import StaffStatusBadge, { TYPE_LABELS } from './StaffStatusBadge';
import './StaffComponents.css';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export default function StaffRecordCard({
  record,
  compact = false,
  canEdit = false,
  canDelete = false,
  onDelete,
}) {
  return (
    <article className={`staff-record-card ${compact ? 'compact' : ''}`}>
      <div className="staff-card-header">
        <div>
          <p className="staff-kicker">{record.project?.name || 'Sin proyecto'} - {formatDate(record.recordDate)}</p>
          <h2>{record.title}</h2>
        </div>
        <div className="staff-badge-row">
          <StaffStatusBadge value={record.status} />
          <StaffStatusBadge value={record.visibility} />
        </div>
      </div>

      {!compact && record.description && (
        <p className="staff-card-copy">{record.description}</p>
      )}

      <dl className="staff-card-meta">
        <div>
          <dt>Tipo</dt>
          <dd>{TYPE_LABELS[record.type] || record.type || 'Sin tipo'}</dd>
        </div>
        <div>
          <dt>Archivos</dt>
          <dd>{record.files?.length ?? 0}</dd>
        </div>
      </dl>

      <div className="staff-card-actions">
        <Link className="btn btn-primary btn-sm" to={`/staff/registros/${record.id}`}>
          Ver detalle
        </Link>
        {canEdit && (
          <Link className="btn btn-ghost btn-sm" to={`/staff/registros/${record.id}`}>
            Editar
          </Link>
        )}
        {canDelete && onDelete && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(record)}>
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
}
