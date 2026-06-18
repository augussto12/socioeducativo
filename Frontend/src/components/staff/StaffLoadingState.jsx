import './StaffComponents.css';

export default function StaffLoadingState({ label = 'Cargando...' }) {
  return (
    <div className="staff-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
