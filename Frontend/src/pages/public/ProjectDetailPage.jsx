import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicProjectBySlug, getPublicProjectRecords } from '../../api/projects.api';
import RecordCard from '../../components/public/RecordCard';
import FilePreview from '../../components/public/FilePreview';
import LoadingState from '../../components/public/LoadingState';
import ErrorState from '../../components/public/ErrorState';
import EmptyState from '../../components/public/EmptyState';
import NotFoundPage from './NotFoundPage';
import './PublicPages.css';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProject() {
      setLoading(true);
      setError('');
      setNotFound(false);

      try {
        const [projectResponse, recordsResponse] = await Promise.all([
          getPublicProjectBySlug(slug),
          getPublicProjectRecords(slug),
        ]);

        if (!active) return;
        setProject(projectResponse.data);
        setRecords(recordsResponse.data || []);
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError(err.response?.data?.error || 'No se pudo cargar el proyecto.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProject();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <main className="public-page" id="main-content"><LoadingState label="Cargando proyecto..." /></main>;
  if (notFound) return <NotFoundPage title="Proyecto no encontrado" message="El proyecto no existe o no esta publicado." />;
  if (error) return <main className="public-page" id="main-content"><ErrorState message={error} /></main>;

  return (
    <main className="public-page" id="main-content">
      <Link className="public-back-link" to="/proyectos">Volver a proyectos</Link>

      <section className="public-detail-hero">
        {project.coverImageUrl && <img src={project.coverImageUrl} alt="" />}
        <div>
          <div className="public-meta-row">
            {project.category?.name && <span className="public-chip">{project.category.name}</span>}
            {project.status && <span className="public-chip public-chip-muted">{project.status}</span>}
          </div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
      </section>

      <section className="public-detail-grid">
        <article>
          <span className="public-eyebrow">Contenidos curriculares</span>
          <p>{project.curricularContents}</p>
        </article>
        <article>
          <span className="public-eyebrow">Metodologia</span>
          <p>{project.methodology}</p>
        </article>
        <article>
          <span className="public-eyebrow">Duracion</span>
          <p>{project.duration}</p>
        </article>
        <article>
          <span className="public-eyebrow">Fundamento pedagogico</span>
          <p>{project.pedagogicalFoundation}</p>
        </article>
      </section>

      <section className="public-section">
        <div className="public-section-header">
          <div>
            <span className="public-eyebrow">Registros publicados</span>
            <h2>Experiencias del proyecto</h2>
          </div>
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No hay registros publicos"
            message="Este proyecto todavia no tiene registros publicados."
          />
        ) : (
          <div className="public-record-list">
            {records.map((record) => (
              <div className="public-record-item" key={record.id}>
                <RecordCard record={record} />
                {record.files?.length > 0 && (
                  <div className="public-file-grid public-file-grid-compact">
                    {record.files.map((file) => (
                      <FilePreview key={file.id} file={file} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
