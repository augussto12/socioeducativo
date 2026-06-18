import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSiteContentByKey } from '../../api/siteContent.api';
import { getPublicProjects } from '../../api/projects.api';
import ProjectCard from '../../components/public/ProjectCard';
import LoadingState from '../../components/public/LoadingState';
import ErrorState from '../../components/public/ErrorState';
import EmptyState from '../../components/public/EmptyState';
import './PublicPages.css';

const pillars = [
  {
    title: 'Inclusion educativa',
    text: 'Propuestas que acompanan trayectorias, sostienen la permanencia y abren nuevas oportunidades de aprendizaje.',
  },
  {
    title: 'Vinculo comunitario',
    text: 'Trabajo con escuelas, familias, organizaciones y actores del territorio para construir respuestas situadas.',
  },
  {
    title: 'Proyectos pedagogicos',
    text: 'Experiencias concretas donde los saberes se ponen en juego mediante producciones, talleres y registros.',
  },
  {
    title: 'Participacion',
    text: 'Espacios para que ninas, ninos, adolescentes y jovenes tomen la palabra y compartan sus recorridos.',
  },
];

const institutionalParagraphs = [
  'Enmarcado en la Ley Nacional de Educacion Nro. 26.206, la Ley de Educacion Nro. 13.688, en los lineamientos de la Politica Educativa de la DGCyE y en el Plan sexenal 2022-2027 de la Gobernacion de la Provincia de Buenos Aires.',
  'Las politicas socioeducativas promueven la inclusion, igualdad y calidad educativa. Se trabaja acompanando a ninas, ninos, adolescentes y jovenes para contribuir a la igualdad de oportunidades, a la vinculacion y revinculacion con las familias y comunidades, ampliar los universos culturales y construir ciudadanias democraticas y participativas.',
  'Lo socioeducativo es una manera de entender la escuela, recogiendo aquella tradicion del pensamiento pedagogico latinoamericano, argentino y bonaerense que sostiene, vincula y entiende que lo social y lo educativo se encuentran indisociablemente unidos en los procesos de ensenanza y aprendizaje.',
  'Trabajar desde esta perspectiva implica concebir en cada practica la centralidad del vinculo entre la escuela, las familias y la comunidad.',
  'Nuestros proyectos y lineas de accion ponen en el centro la ensenanza y los aprendizajes, y proponen estrategias pedagogicas novedosas contemplando la heterogeneidad y las diversidades, en un trabajo con las instituciones, organizaciones comunitarias y organismos estatales que intervienen e impactan dejando huellas en las biografias de ninas, ninos, adolescentes y jovenes.',
];

const objectiveCards = [
  {
    title: 'Cuidado y escucha comunitaria',
    text: 'Brindar espacios de cuidado y escucha comunitarios para el abordaje educativo de problematicas que impacten en el devenir de trayectorias educativas.',
  },
  {
    title: 'Revinculacion educativa',
    text: 'Ampliar el territorio de la escuela trabajando con proyectos institucionales que buscan la promocion de aprendizajes y la socializacion para la vinculacion de las/os NNAyJ con las escuelas, asi como la revinculacion de quienes se encuentren desvinculados.',
  },
  {
    title: 'Proyectos de vida posibles',
    text: 'Ponderar y visibilizar proyectos de vida posibles vinculados a la oferta educativa de la ciudad que tengan como disparador la finalizacion de los estudios secundarios.',
  },
  {
    title: 'Saberes con intereses centrales',
    text: 'Promover la apropiacion de saberes en los cuales los intereses de las/los estudiantes ocupan un lugar central, trabajando grupalidades flexibles, espacios participativos y temporalidades situadas.',
  },
];

function compactText(value, fallback, maxLength = 230) {
  const text = (value || fallback || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function HomePage() {
  const [home, setHome] = useState(null);
  const [objectives, setObjectives] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHome() {
      setLoading(true);
      setError('');

      try {
        const [homeResponse, projectsResponse, objectivesResponse] = await Promise.allSettled([
          getSiteContentByKey('home'),
          getPublicProjects(),
          getSiteContentByKey('objetivos'),
        ]);

        if (!active) return;

        if (homeResponse.status !== 'fulfilled' || projectsResponse.status !== 'fulfilled') {
          throw new Error('No se pudo cargar la portada publica.');
        }

        setHome(homeResponse.value.data);
        setProjects(projectsResponse.value.data || []);
        setObjectives(objectivesResponse.status === 'fulfilled' ? objectivesResponse.value.data : null);
      } catch (err) {
        if (active) setError(err.response?.data?.error || err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHome();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <main className="public-page" id="main-content"><LoadingState label="Cargando inicio..." /></main>;
  if (error) return <main className="public-page" id="main-content"><ErrorState message={error} /></main>;

  const featuredProjects = projects.slice(0, 4);
  const introText = compactText(
    home?.content,
    'Acompanamos trayectorias educativas con propuestas pedagogicas, espacios de cuidado y participacion comunitaria.'
  );
  const objectiveIntro = compactText(
    objectives?.content,
    'El centro promueve cuidado, revinculacion educativa, aprendizajes situados y construccion colectiva de ciudadania.',
    180
  );

  return (
    <main className="public-page public-home" id="main-content">
      <section className="public-hero public-home-hero">
        <div className="public-hero-copy">
          <span className="public-eyebrow">Centros socioeducativos y comunitarios</span>
          <h1>Espacios de cuidado, aprendizaje y participacion</h1>
          <p className="public-hero-lead">
            Junto a la escuela, las familias y la comunidad, acompanamos procesos educativos en barrios populares.
          </p>
          <p className="public-hero-intro">{introText}</p>
          <div className="public-actions">
            <Link className="public-primary-action" to="/proyectos">Ver proyectos pedagogicos</Link>
            <Link className="public-secondary-action" to="/quienes-somos">Conocer el centro</Link>
          </div>
        </div>

        <aside className="public-hero-panel public-identity-panel" aria-label="Resumen institucional">
          <div className="public-panel-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span>Trabajo pedagogico situado</span>
          <strong>{projects.length}</strong>
          <p>proyectos publicos para recorrer experiencias, registros y producciones del proceso.</p>
        </aside>
      </section>

      <section className="public-section public-institutional-frame" aria-labelledby="lineamientos-title">
        <div className="public-institutional-heading">
          <span className="public-eyebrow">Marco institucional</span>
          <h2 id="lineamientos-title">Direccion de Politicas Socioeducativas</h2>
          <p className="public-institutional-period">Lineamientos prioritarios 2024 - 2027</p>
        </div>

        <div className="public-institutional-copy">
          {institutionalParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="public-section public-presentation">
        <div className="public-section-kicker">
          <span className="public-eyebrow">Una propuesta integral</span>
          <h2>Acompanamiento educativo con identidad territorial</h2>
          <p>
            La propuesta integra cuidado, ensenanza, participacion y trabajo territorial para fortalecer trayectorias educativas desde una mirada comunitaria.
          </p>
        </div>

        <div className="public-pillar-grid">
          {pillars.map((pillar) => (
            <article className="public-pillar-card" key={pillar.title}>
              <span className="public-mini-mark" aria-hidden="true" />
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-objectives-section">
        <div className="public-objectives-copy">
          <span className="public-eyebrow">Nuestros objetivos</span>
          <h2>{objectives?.title || 'Objetivos del centro'}</h2>
          <p>{objectiveIntro}</p>
        </div>

        <div className="public-objective-grid">
          {objectiveCards.map((objective, index) => (
            <article className="public-objective-card" key={objective.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{objective.title}</strong>
              <p>{objective.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-projects-section">
        <div className="public-section-header">
          <div>
            <span className="public-eyebrow">Proyectos destacados</span>
            <h2>Propuestas pedagogicas</h2>
            <p>Una seleccion de proyectos publicados por el equipo para compartir procesos, materiales y registros.</p>
          </div>
          <Link className="public-text-link" to="/proyectos">Ver todos</Link>
        </div>

        {featuredProjects.length > 0 ? (
          <div className="public-card-grid">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} featured />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay proyectos publicos todavia"
            message="Cuando el equipo publique proyectos, van a aparecer en esta portada."
          />
        )}
      </section>

      <section className="public-section public-closing-cta">
        <div>
          <span className="public-eyebrow">Registros y recorridos</span>
          <h2>Conoce los proyectos pedagogicos y los registros del proceso de trabajo.</h2>
        </div>
        <Link className="public-primary-action" to="/proyectos">Ir a proyectos</Link>
      </section>
    </main>
  );
}
