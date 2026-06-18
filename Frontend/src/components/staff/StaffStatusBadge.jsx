import './StaffComponents.css';

export const STATUS_LABELS = {
  DRAFT: 'Borrador',
  PENDING_REVIEW: 'Pendiente de revision',
  PUBLISHED: 'Publicado',
  REJECTED: 'Rechazado',
  ARCHIVED: 'Archivado',
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  FINISHED: 'Finalizado',
  PUBLIC: 'Publico',
  PRIVATE: 'Privado',
};

export const TYPE_LABELS = {
  ACTIVITY: 'Actividad',
  EVIDENCE: 'Evidencia',
  PLANNING: 'Planificacion',
  REFLECTION: 'Reflexion',
  EVALUATION: 'Evaluacion',
  OTHER: 'Otro',
};

const variants = {
  PUBLISHED: 'success',
  ACTIVE: 'success',
  PUBLIC: 'success',
  PENDING_REVIEW: 'warning',
  PAUSED: 'warning',
  REJECTED: 'danger',
  ARCHIVED: 'muted',
  DRAFT: 'info',
  FINISHED: 'info',
  PRIVATE: 'muted',
};

export function getStatusLabel(value) {
  return STATUS_LABELS[value] || TYPE_LABELS[value] || value || 'Sin estado';
}

export default function StaffStatusBadge({ value }) {
  const variant = variants[value] || 'muted';

  return (
    <span className={`staff-badge staff-badge-${variant}`}>
      {getStatusLabel(value)}
    </span>
  );
}
