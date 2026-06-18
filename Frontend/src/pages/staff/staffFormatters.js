export const RECORD_TYPES = [
  { value: 'ACTIVITY', label: 'Actividad' },
  { value: 'EVIDENCE', label: 'Evidencia' },
  { value: 'PLANNING', label: 'Planificacion' },
  { value: 'REFLECTION', label: 'Reflexion' },
  { value: 'EVALUATION', label: 'Evaluacion' },
  { value: 'OTHER', label: 'Otro' },
];

export const RECORD_STATUSES = ['PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'DRAFT', 'ARCHIVED'];

export function dateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function isOwnEditableRecord(record, user) {
  return record?.createdBy === user?.id && record?.status !== 'PUBLISHED';
}

export function projectRecordCount(project) {
  return project?._count?.records ?? project?.records?.length ?? 0;
}
