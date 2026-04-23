/**
 * LandingPage — Public dashboard showing tournament data for visitors.
 * Displays stats, active tournaments, recent results, teams, and game types.
 * Login button in navbar and hero section.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments, getStandings, getGameTypes } from '../../api/tournaments.api';
import { getTeams } from '../../api/teams.api';
import { getMatchesByTournament } from '../../api/matches.api';
import { getBirthdaysToday } from '../../api/players.api';
import SkeletonLoader from '../../components/SkeletonLoader';
import StandingsTable from '../../components/StandingsTable';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [birthdays, setBirthdays] = useState([]);

  const load = useCallback(async () => {
    try {
      const [tourneysRes, teamsRes, gamesRes] = await Promise.all([
        getTournaments({ limit: 50 }),
        getTeams({ limit: 100 }),
        getGameTypes(),
      ]);

      const allTourneys = tourneysRes.data.tournaments || [];
      const allTeams = teamsRes.data.teams || [];

      setTournaments(allTourneys);
      setTeams(allTeams);
      setGameTypes(gamesRes.data || []);

      // Fetch today's birthdays
      getBirthdaysToday().then(r => setBirthdays(r.data || [])).catch(() => {});

      // Find active tournament for standings + matches
      const active = allTourneys.find(t => t.status === 'IN_PROGRESS') || allTourneys[0];
      if (active) {
        setActiveTournament(active);
        const [sRes, mRes] = await Promise.all([
          getStandings(active.id).catch(() => ({ data: [] })),
          getMatchesByTournament(active.id, { limit: 50 }).catch(() => ({ data: { matches: [] } })),
        ]);
        setStandings(sRes.data || []);
        // Get recent played + upcoming matches
        const allMatches = mRes.data.matches || [];
        const played = allMatches.filter(m => m.status === 'PLAYED').slice(-5).reverse();
        const upcoming = allMatches.filter(m => m.status === 'PENDING').slice(0, 5);
        setRecentMatches([...upcoming, ...played]);
      }
    } catch (err) {
      console.error('Landing load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = tournaments.filter(t => t.status === 'IN_PROGRESS').length;
  const finishedCount = tournaments.filter(t => t.status === 'FINISHED').length;
  const playedMatches = recentMatches.filter(m => m.status === 'PLAYED');
  const upcomingMatches = recentMatches.filter(m => m.status === 'PENDING');

  if (loading) return <SkeletonLoader variant="full-page" />;

  return (
    <div className="landing-page">
      {/* ─── Navbar ──────────────────────────────────── */}
      <nav className="landing-nav" role="navigation" aria-label="Navegación principal">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <span className="landing-nav-emoji" aria-hidden="true">🏆</span>
            <div>
              <span className="landing-nav-title">SocioEduca</span>
              <span className="landing-nav-sub">Torneos</span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm landing-login-btn" onClick={() => navigate('/login')}>
            👋 Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────── */}
      <section className="landing-hero" aria-label="Bienvenida">
        <div className="hero-floating-emojis" aria-hidden="true">
          {['🏓', '♟️', '🃏', '⚽', '🎯', '🏀', '🎮', '🎲'].map((e, i) => (
            <span key={i} className={`float-emoji float-${i + 1}`}>{e}</span>
          ))}
        </div>
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Los Torneos <br />
            <span className="gradient-text">del Socio</span>
          </h1>
          <p className="landing-hero-sub">
            Competencias de ping pong, ajedrez, truco y más. Seguí los torneos en vivo, mirá las posiciones y bancá a tu equipo 🔥
          </p>
          <div className="landing-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              🚀 Iniciar Sesión
            </button>
            <a href="#torneos" className="btn btn-ghost btn-lg">
              📊 Ver Torneos
            </a>
          </div>
        </div>
      </section>

      {/* ─── Birthday Banner ─────────────────────────── */}
      {birthdays.length > 0 && (
        <section className="landing-birthday" aria-label="Cumpleaños del día">
          <div className="birthday-banner">
            <span className="birthday-confetti" aria-hidden="true">🎉</span>
            <div className="birthday-content">
              <strong className="birthday-title">🎂 ¡Feliz Cumpleaños!</strong>
              <div className="birthday-names">
                {birthdays.map((p, i) => (
                  <span key={p.id} className="birthday-name">
                    {p.nickname || p.firstName} {p.lastName}
                    <span className="birthday-team"> ({p.team?.name})</span>
                    {i < birthdays.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
            <span className="birthday-confetti" aria-hidden="true">🎊</span>
          </div>
        </section>
      )}

      {/* ─── Stats Row ───────────────────────────────── */}
      <section className="landing-stats" aria-label="Estadísticas generales">
        <div className="landing-stats-grid">
          <div className="landing-stat-card">
            <span className="landing-stat-icon" aria-hidden="true">🏆</span>
            <span className="landing-stat-num">{tournaments.length}</span>
            <span className="landing-stat-label">Torneos</span>
          </div>
          <div className="landing-stat-card">
            <span className="landing-stat-icon" aria-hidden="true">🛡️</span>
            <span className="landing-stat-num">{teams.length}</span>
            <span className="landing-stat-label">Equipos</span>
          </div>
          <div className="landing-stat-card">
            <span className="landing-stat-icon" aria-hidden="true">🔥</span>
            <span className="landing-stat-num">{activeCount}</span>
            <span className="landing-stat-label">En Juego</span>
          </div>
          <div className="landing-stat-card">
            <span className="landing-stat-icon" aria-hidden="true">🎮</span>
            <span className="landing-stat-num">{gameTypes.length}</span>
            <span className="landing-stat-label">Juegos</span>
          </div>
        </div>
      </section>

      {/* ─── Active Tournaments ──────────────────────── */}
      <section className="landing-section" id="torneos" aria-label="Torneos">
        <h2 className="landing-section-title">
          <span aria-hidden="true">🏆</span> Torneos
        </h2>
        {tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">🏆</div>
            <h3>Todavía no hay torneos</h3>
            <p>Los torneos se mostrarán acá cuando se creen</p>
          </div>
        ) : (
          <div className="landing-tournaments-grid">
            {tournaments.map((t) => {
              const statusEmoji = { DRAFT: '📝', INSCRIPTIONS_OPEN: '✍️', IN_PROGRESS: '🔥', FINISHED: '🏅', CANCELLED: '❌' };
              const statusText = { DRAFT: 'Preparando', INSCRIPTIONS_OPEN: 'Inscripciones', IN_PROGRESS: '¡En Juego!', FINISHED: 'Terminado', CANCELLED: 'Cancelado' };
              return (
                <article
                  key={t.id}
                  className={`landing-tournament-card ${t.status === 'IN_PROGRESS' ? 'is-active' : ''}`}
                  onClick={() => navigate(`/tournament/${t.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/tournament/${t.id}`)}
                  aria-label={`Ver ${t.name}`}
                >
                  <div className="lt-card-top">
                    <span className="lt-card-icon" aria-hidden="true">{t.gameType?.icon || '🎮'}</span>
                    <span className={`badge ${t.status === 'IN_PROGRESS' ? 'badge-active' : t.status === 'FINISHED' ? 'badge-win' : 'badge-pending'}`}>
                      {statusEmoji[t.status]} {statusText[t.status]}
                    </span>
                  </div>
                  <h3 className="lt-card-name">{t.name}</h3>
                  <div className="lt-card-meta">
                    <span>{t.gameType?.name}</span>
                    <span className="lt-card-dot" aria-hidden="true">·</span>
                    <span>{t.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación'}</span>
                    <span className="lt-card-dot" aria-hidden="true">·</span>
                    <span>🛡️ {t._count?.tournamentTeams || 0}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Standings ───────────────────────────────── */}
      {activeTournament && standings.length > 0 && (
        <section className="landing-section" aria-label="Tabla de posiciones">
          <h2 className="landing-section-title">
            <span aria-hidden="true">📊</span> Posiciones — {activeTournament.name}
          </h2>
          <div className="landing-standings-wrap">
            <StandingsTable standings={standings} />
          </div>
        </section>
      )}

      {/* ─── Recent / Upcoming Matches ───────────────── */}
      {recentMatches.length > 0 && (
        <section className="landing-section" aria-label="Partidos recientes">
          <h2 className="landing-section-title">
            <span aria-hidden="true">⚡</span> Partidos
          </h2>
          <div className="landing-matches-list">
            {upcomingMatches.length > 0 && (
              <div className="landing-matches-group">
                <h3 className="landing-matches-subtitle">
                  <span className="pulse-dot" aria-hidden="true" /> Próximos
                </h3>
                {upcomingMatches.map((m) => (
                  <div key={m.id} className="landing-match-card upcoming">
                    <span className="lm-team">{m.homeTeam?.name || 'TBD'}</span>
                    <span className="lm-vs" aria-hidden="true">VS</span>
                    <span className="lm-team">{m.awayTeam?.name || 'TBD'}</span>
                  </div>
                ))}
              </div>
            )}
            {playedMatches.length > 0 && (
              <div className="landing-matches-group">
                <h3 className="landing-matches-subtitle">✅ Últimos Resultados</h3>
                {playedMatches.map((m) => (
                  <div key={m.id} className="landing-match-card played">
                    <span className="lm-team">{m.homeTeam?.name || 'TBD'}</span>
                    <span className="lm-score">
                      {m.result?.homeScore ?? '?'}
                      <span className="lm-score-sep" aria-hidden="true">-</span>
                      {m.result?.awayScore ?? '?'}
                    </span>
                    <span className="lm-team">{m.awayTeam?.name || 'TBD'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Teams ───────────────────────────────────── */}
      {teams.length > 0 && (
        <section className="landing-section" aria-label="Equipos">
          <h2 className="landing-section-title">
            <span aria-hidden="true">🛡️</span> Equipos
          </h2>
          <div className="landing-teams-grid">
            {teams.map((t) => (
              <div key={t.id} className="landing-team-chip">
                {t.shieldUrl ? (
                  <img
                    src={t.shieldUrl.startsWith('http') ? t.shieldUrl : `${window.location.origin}${t.shieldUrl}`}
                    className="landing-team-shield"
                    alt=""
                    loading="lazy"
                    width="32"
                    height="32"
                  />
                ) : (
                  <div className="landing-team-placeholder" aria-hidden="true">
                    {t.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="landing-team-name">{t.name}</span>
                <span className="landing-team-count">👥 {t._count?.players || 0}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Game Types ──────────────────────────────── */}
      {gameTypes.length > 0 && (
        <section className="landing-section" aria-label="Tipos de juego">
          <h2 className="landing-section-title">
            <span aria-hidden="true">🎮</span> Juegos Disponibles
          </h2>
          <div className="landing-games-grid">
            {gameTypes.map((g) => (
              <div key={g.id} className="landing-game-card">
                <span className="landing-game-icon" aria-hidden="true">{g.icon}</span>
                <span className="landing-game-name">{g.name}</span>
                {g.description && <span className="landing-game-desc">{g.description}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA ─────────────────────────────────────── */}
      <section className="landing-cta" aria-label="Llamada a la acción">
        <div className="landing-cta-content">
          <span className="landing-cta-emoji" aria-hidden="true">🚀</span>
          <h2>¿Sos parte de un equipo?</h2>
          <p>Iniciá sesión para ver tus torneos, posiciones y próximos partidos</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            👋 Iniciar Sesión
          </button>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="landing-footer" role="contentinfo">
        <span>⚡ Hecho con 💜 para los futuros campeones</span>
        <span className="landing-footer-year">SocioEduca Torneos · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
