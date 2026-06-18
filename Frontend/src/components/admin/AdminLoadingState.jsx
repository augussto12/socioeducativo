import './AdminComponents.css';

export default function AdminLoadingState({ label = 'Cargando datos...' }) {
  return (
    <div className="admin-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
