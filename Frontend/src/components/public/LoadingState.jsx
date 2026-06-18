export default function LoadingState({ label = 'Cargando contenido...' }) {
  return (
    <div className="public-state" role="status" aria-live="polite">
      <div className="public-loader" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
