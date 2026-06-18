export default function EmptyState({ title = 'Todavia no hay contenido publico', message = 'Cuando haya novedades publicadas van a aparecer aca.' }) {
  return (
    <div className="public-state public-state-empty">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
