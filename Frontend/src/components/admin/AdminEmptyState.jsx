import './AdminComponents.css';

export default function AdminEmptyState({ title = 'Sin datos', message = 'Todavia no hay informacion para mostrar.' }) {
  return (
    <div className="admin-state admin-state-empty">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
