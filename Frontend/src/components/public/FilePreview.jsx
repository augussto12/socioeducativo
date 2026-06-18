import client from '../../api/client';

function fileUrl(file) {
  const base = client.defaults.baseURL || '/api';
  return `${base}/files/${file.id}`;
}

function fileLabel(file) {
  return file.originalName || file.fileName || 'Archivo';
}

export default function FilePreview({ file }) {
  const url = fileUrl(file);
  const label = fileLabel(file);

  if (file.type === 'IMAGE') {
    return (
      <figure className="file-preview file-preview-image">
        <img src={url} alt={label} loading="lazy" />
        <figcaption>{label}</figcaption>
      </figure>
    );
  }

  if (file.type === 'AUDIO') {
    return (
      <div className="file-preview">
        <strong>{label}</strong>
        <audio controls src={url}>
          <a href={url}>Descargar audio</a>
        </audio>
      </div>
    );
  }

  if (file.type === 'VIDEO') {
    return (
      <div className="file-preview">
        <strong>{label}</strong>
        <video controls src={url} />
      </div>
    );
  }

  const action = file.type === 'PDF' ? 'Ver/descargar PDF' : 'Descargar documento';

  return (
    <a className="file-preview file-preview-link" href={url} target="_blank" rel="noreferrer">
      <span>{label}</span>
      <strong>{action}</strong>
    </a>
  );
}
