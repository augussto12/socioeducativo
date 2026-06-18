import './AdminComponents.css';

export default function AdminErrorState({ message = 'No se pudo cargar la informacion.' }) {
  return (
    <div className="admin-state admin-state-error" role="alert">
      <h2>Error</h2>
      <p>{message}</p>
    </div>
  );
}
