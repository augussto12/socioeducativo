import { useEffect, useState } from 'react';
import { getSiteContentByKey } from '../../api/siteContent.api';
import LoadingState from '../../components/public/LoadingState';
import ErrorState from '../../components/public/ErrorState';
import './PublicPages.css';

export default function AboutPage() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadContent() {
      setLoading(true);
      setError('');

      try {
        const responses = await Promise.allSettled([
          getSiteContentByKey('quienes-somos'),
          getSiteContentByKey('objetivos'),
          getSiteContentByKey('normativa'),
        ]);

        if (!active) return;

        if (responses[0].status !== 'fulfilled') {
          throw new Error('No se pudo cargar la informacion institucional.');
        }

        setContent({
          about: responses[0].value.data,
          objectives: responses[1].status === 'fulfilled' ? responses[1].value.data : null,
          rules: responses[2].status === 'fulfilled' ? responses[2].value.data : null,
        });
      } catch (err) {
        if (active) setError(err.response?.data?.error || err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContent();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <main className="public-page" id="main-content"><LoadingState label="Cargando quienes somos..." /></main>;
  if (error) return <main className="public-page" id="main-content"><ErrorState message={error} /></main>;

  return (
    <main className="public-page" id="main-content">
      <section className="public-page-heading">
        <span className="public-eyebrow">Institucional</span>
        <h1>{content.about?.title || 'Quienes somos'}</h1>
        <p>{content.about?.content}</p>
      </section>

      <section className="public-section public-story-layout">
        <article className="public-story-card">
          <span className="public-eyebrow">Historia y origen</span>
          <h2>Un espacio de acompanamiento</h2>
          <p>{content.about?.content}</p>
        </article>

        <div className="public-story-stack">
          <article className="public-info-block">
            <h2>{content.objectives?.title || 'Objetivos'}</h2>
            <p>{content.objectives?.content || 'Fortalecer trayectorias educativas, vinculos y proyectos colectivos desde una mirada integral.'}</p>
          </article>
          <article className="public-info-block">
            <h2>{content.rules?.title || 'Normativa'}</h2>
            <p>{content.rules?.content || 'Marco institucional y estatal que encuadra el funcionamiento cotidiano del centro.'}</p>
          </article>
        </div>
      </section>

      <section className="public-section public-section-grid">
        <article>
          <span className="public-eyebrow">Marco institucional</span>
          <h2>Trabajo articulado</h2>
          <p>El centro organiza propuestas pedagogicas, instancias de seguimiento y acciones con actores institucionales y comunitarios.</p>
        </article>
        <article>
          <span className="public-eyebrow">Logros</span>
          <h2>Procesos visibles</h2>
          <p>Los registros publicos permiten compartir avances, producciones y experiencias que dan cuenta del recorrido de cada proyecto.</p>
        </article>
      </section>
    </main>
  );
}
