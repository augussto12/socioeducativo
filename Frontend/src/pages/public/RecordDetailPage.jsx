import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicRecordById } from '../../api/records.api';
import FilePreview from '../../components/public/FilePreview';
import LoadingState from '../../components/public/LoadingState';
import ErrorState from '../../components/public/ErrorState';
import EmptyState from '../../components/public/EmptyState';
import NotFoundPage from './NotFoundPage';
import './PublicPages.css';

const typeLabels = {
  ACTIVITY: 'Actividad',
  EVIDENCE: 'Evidencia',
  PLANNING: 'Planificacion',
  REFLECTION: 'Reflexion',
  EVALUATION: 'Evaluacion',
  OTHER: 'Otro',
};

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function RecordDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRecord() {
      setLoading(true);
      setError('');
      setNotFound(false);

      try {
        const { data } = await getPublicRecordById(id);
        if (active) setRecord(data);
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError(err.response?.data?.error || 'No se pudo cargar el registro.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecord();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <main className="public-page" id="main-content"><LoadingState label="Cargando registro..." /></main>;
  if (notFound) return <NotFoundPage title="Registro no encontrado" message="El registro no existe, no esta publicado o pertenece a un proyecto privado." />;
  if (error) return <main className="public-page" id="main-content"><ErrorState message={error} /></main>;

  return (
    <main className="public-page" id="main-content">
      {record.project?.slug && <Link className="public-back-link" to={`/proyectos/${record.project.slug}`}>Volver al proyecto</Link>}

      <article className="public-record-detail">
        <div className="public-meta-row">
          <span className="public-chip">{typeLabels[record.type] || record.type}</span>
          {record.recordDate && <span className="public-date">{formatDate(record.recordDate)}</span>}
        </div>
        <h1>{record.title}</h1>
        {record.project?.name && <p className="record-project">Proyecto: {record.project.name}</p>}
        {record.description && <p>{record.description}</p>}
      </article>

      <section className="public-section">
        <div className="public-section-header">
          <div>
            <span className="public-eyebrow">Archivos publicos</span>
            <h2>Material asociado</h2>
          </div>
        </div>

        {record.files?.length > 0 ? (
          <div className="public-file-grid">
            {record.files.map((file) => (
              <FilePreview key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay archivos publicos"
            message="Este registro no tiene archivos publicados para descargar."
          />
        )}
      </section>
    </main>
  );
}
