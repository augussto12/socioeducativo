export default function ErrorState({ title = 'No pudimos cargar el contenido', message = 'Volve a intentar en unos minutos.' }) {
  return (
    <div className="public-state public-state-error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
