import { useState } from 'react';
import { deleteFile, downloadFile } from '../../api/files.api';
import StaffStatusBadge from './StaffStatusBadge';
import './StaffComponents.css';

function formatSize(value) {
  const size = Number(value || 0);
  if (!size) return 'Tamano no informado';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StaffFileList({ files = [], canDeleteFile, onDeleted }) {
  const [workingId, setWorkingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleDownload = async (file) => {
    setWorkingId(file.id);
    setFeedback(null);
    try {
      const { data } = await downloadFile(file.id);
      const blob = new Blob([data], { type: file.mimeType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalName || file.fileName || 'archivo';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'No se pudo descargar el archivo.',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const handleDelete = async (file) => {
    const confirmed = window.confirm(`Eliminar "${file.originalName}"?`);
    if (!confirmed) return;

    setWorkingId(file.id);
    setFeedback(null);
    try {
      await deleteFile(file.id);
      setFeedback({ type: 'success', message: 'Archivo eliminado.' });
      if (onDeleted) onDeleted(file.id);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'No se pudo eliminar el archivo.',
      });
    } finally {
      setWorkingId(null);
    }
  };

  if (!files.length) {
    return (
      <div className="staff-file-list empty">
        <p>No hay archivos asociados a este registro.</p>
      </div>
    );
  }

  return (
    <div className="staff-file-list">
      {feedback && <div className={`staff-feedback ${feedback.type}`}>{feedback.message}</div>}

      {files.map((file) => (
        <article key={file.id} className="staff-file-item">
          <div>
            <h3>{file.originalName || file.fileName}</h3>
            <p>{file.type} - {file.mimeType} - {formatSize(file.size)}</p>
            <StaffStatusBadge value={file.visibility} />
          </div>
          <div className="staff-file-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleDownload(file)}
              disabled={workingId === file.id}
            >
              Descargar
            </button>
            {canDeleteFile?.(file) && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(file)}
                disabled={workingId === file.id}
              >
                Eliminar
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
