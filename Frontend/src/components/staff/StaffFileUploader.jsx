import { useRef, useState } from 'react';
import { uploadMyRecordFile } from '../../api/staff.api';
import './StaffComponents.css';

const acceptedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'text/plain',
].join(',');

export default function StaffFileUploader({ recordId, onUploaded }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !recordId) {
      setFeedback({ type: 'error', message: 'Selecciona un archivo para subir.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setProgress(0);
    setFeedback(null);
    try {
      const { data } = await uploadMyRecordFile(recordId, formData, (eventProgress) => {
        if (!eventProgress.total) return;
        setProgress(Math.round((eventProgress.loaded * 100) / eventProgress.total));
      });
      setFeedback({ type: 'success', message: 'Archivo subido.' });
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      if (onUploaded) onUploaded(data);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'No se pudo subir el archivo.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="staff-uploader" onSubmit={handleSubmit}>
      <div>
        <h3>Subir archivo</h3>
        <p>Imagen, PDF, audio, video o documento permitido. Los archivos privados se abren con sesion iniciada.</p>
      </div>

      <label className="staff-file-input">
        <span>{selectedFile ? selectedFile.name : 'Seleccionar archivo'}</span>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] || null);
            setFeedback(null);
          }}
        />
      </label>

      {uploading && (
        <div className="staff-progress" aria-label={`Progreso ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      {feedback && <div className={`staff-feedback ${feedback.type}`}>{feedback.message}</div>}

      <button type="submit" className="btn btn-primary" disabled={uploading || !selectedFile}>
        {uploading ? 'Subiendo...' : 'Subir archivo'}
      </button>
    </form>
  );
}
