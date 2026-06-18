import './StaffComponents.css';

export default function StaffErrorState({ message = 'No se pudo cargar la informacion.', onRetry }) {
  return (
    <div className="staff-state staff-state-error" role="alert">
      <h2>Algo no salio bien</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
