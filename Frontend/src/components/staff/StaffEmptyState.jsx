import './StaffComponents.css';

export default function StaffEmptyState({ title = 'Sin resultados', message, action }) {
  return (
    <div className="staff-state staff-state-empty">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action && <div className="staff-state-action">{action}</div>}
    </div>
  );
}
