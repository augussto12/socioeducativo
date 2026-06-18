import './AdminComponents.css';

const toneByValue = {
  PUBLIC: 'success',
  PRIVATE: 'muted',
  ACTIVE: 'success',
  DRAFT: 'muted',
  PAUSED: 'warning',
  FINISHED: 'info',
  ARCHIVED: 'muted',
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  ADMIN: 'info',
  STAFF: 'muted',
  true: 'success',
  false: 'danger',
};

export default function AdminStatusBadge({ value, label }) {
  const normalized = String(value);
  const tone = toneByValue[normalized] || 'muted';

  return (
    <span className={`admin-badge admin-badge-${tone}`}>
      {label || normalized}
    </span>
  );
}
