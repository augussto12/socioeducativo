/**
 * TeamDashboard — Team home page showing hero card, next match, and recent results.
 * This is now only the "home" view, standings and tournaments are separate pages.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeam } from '../../api/teams.api';
import { getTournamentsByTeam } from '../../api/tournaments.api';
import { getNextMatch, getRecentResults } from '../../api/matches.api';
import SkeletonLoader from '../../components/SkeletonLoader';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import './TeamDashboard.css';

export default function TeamDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?.teamId) return;
    try {
      setError(null);
      const [teamRes, tourneysRes, nextRes, recentRes] = await Promise.all([
        getTeam(user.teamId),
        getTournamentsByTeam(user.teamId).catch(() => ({ data: [] })),
        getNextMatch(user.teamId).catch(() => ({ data: null })),
        getRecentResults(user.teamId, 5).catch(() => ({ data: [] })),
      ]);
      setTeam(teamRes.data);
      setTournaments(tourneysRes.data || []);
      setNextMatch(nextRes.data);
      setRecentResults(recentRes.data || []);
    } catch (err) {
      setError('Error cargando datos. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user?.teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { refresh } = usePullToRefresh(loadData);

  const getOutcome = useCallback((match) => {
    if (!match.result) return null;
    const isHome = match.homeTeamId === user.teamId;
    const myScore = isHome ? match.result.homeScore : match.result.awayScore;
    const theirScore = isHome ? match.result.awayScore : match.result.homeScore;
    if (myScore > theirScore) return 'W';
    if (myScore < theirScore) return 'L';
    return 'D';
  }, [user?.teamId]);

  const shieldSrc = useMemo(() => {
    if (!team?.shieldUrl) return null;
    return team.shieldUrl.startsWith('http') ? team.shieldUrl : `${window.location.origin}${team.shieldUrl}`;
  }, [team?.shieldUrl]);

  if (loading) {
    return <SkeletonLoader variant="full-page" />;
  }

  if (error) {
    return (
      <div className="team-error-state">
        <span className="emoji-decorative" aria-hidden="true">😢</span>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={refresh}>🔄 Reintentar</button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-error-state">
        <span className="emoji-decorative" aria-hidden="true">😢</span>
        <p>Equipo no encontrado</p>
      </div>
    );
  }

  return (
    <section className="team-dash" aria-label="Panel del equipo">
      {/* ─── Hero Banner ────────────────────────── */}
      <div className="hero-banner">
        <div className="hero-confetti" aria-hidden="true">
          {['🏆', '⭐', '🎯', '🔥', '💪', '⚡'].map((e, i) => (
            <span key={i} className={`confetti-item confetti-${i + 1}`}>{e}</span>
          ))}
        </div>

        <div className="hero-shield-area">
          {shieldSrc ? (
            <img
              src={shieldSrc}
              alt={`Escudo de ${team.name}`}
              className="hero-shield-img"
              loading="lazy"
              width="100"
              height="100"
            />
          ) : (
            <div className="hero-shield-placeholder" aria-hidden="true">
              {team.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="hero-team-name">{team.name}</h1>

        <div className="hero-stats-row">
          <div className="hero-stat">
            <span className="hero-stat-num">{team.players?.length || 0}</span>
            <span className="hero-stat-label"><span aria-hidden="true">👥</span> Jugadores</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">{tournaments.length || 0}</span>
            <span className="hero-stat-label"><span aria-hidden="true">🏆</span> Torneos</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">{recentResults.length || 0}</span>
            <span className="hero-stat-label"><span aria-hidden="true">🎮</span> Partidos</span>
          </div>
        </div>
      </div>

      {/* ─── Next Match Spotlight ───────────────── */}
      {nextMatch && (
        <article className="next-match-spotlight" aria-label="Próximo partido">
          <div className="spotlight-label">
            <span className="spotlight-pulse" aria-hidden="true" />
            <span aria-hidden="true">⚡</span> PRÓXIMO PARTIDO
          </div>
          <div className="spotlight-matchup">
            <div className="spotlight-team">
              <div className="spotlight-shield" aria-hidden="true">
                {nextMatch.homeTeam?.name?.substring(0, 2)}
              </div>
              <span className="spotlight-name">{nextMatch.homeTeam?.name}</span>
            </div>
            <div className="spotlight-vs" aria-hidden="true">
              <span>VS</span>
            </div>
            <div className="spotlight-team">
              <div className="spotlight-shield" aria-hidden="true">
                {nextMatch.awayTeam?.name?.substring(0, 2)}
              </div>
              <span className="spotlight-name">{nextMatch.awayTeam?.name}</span>
            </div>
          </div>
          <div className="spotlight-meta">
            <span aria-hidden="true">{nextMatch.tournament?.gameType?.icon}</span> {nextMatch.tournament?.name}
            {nextMatch.scheduledAt && ` · 📅 ${new Date(nextMatch.scheduledAt).toLocaleDateString('es-AR')}`}
          </div>
        </article>
      )}

      {/* ─── Recent Results ─────────────────────── */}
      <section className="dash-card card-results" aria-label="Últimos resultados">
        <div className="dash-card-header">
          <span className="card-emoji" aria-hidden="true">📊</span>
          <h2>Últimos Resultados</h2>
        </div>
        {recentResults.length === 0 ? (
          <div className="card-empty">
            <span className="card-empty-emoji" aria-hidden="true">🎮</span>
            <p>¡Todavía no jugaste ningún partido!</p>
            <p className="card-empty-sub">Esperá a que arranque el torneo 💪</p>
          </div>
        ) : (
          <div className="results-list">
            {recentResults.map((m) => {
              const isHome = m.homeTeamId === user.teamId;
              const opponent = isHome ? m.awayTeam : m.homeTeam;
              const myScore = isHome ? m.result?.homeScore : m.result?.awayScore;
              const theirScore = isHome ? m.result?.awayScore : m.result?.homeScore;
              const outcome = getOutcome(m);

              return (
                <div key={m.id} className={`result-row result-${outcome?.toLowerCase()}`}>
                  <div className={`result-badge ${outcome === 'W' ? 'badge-win-fun' : outcome === 'L' ? 'badge-loss-fun' : 'badge-draw-fun'}`} aria-hidden="true">
                    {outcome === 'W' ? '🏅' : outcome === 'L' ? '😤' : '🤝'}
                  </div>
                  <div className="result-info">
                    <span className="result-opponent">vs {opponent?.name}</span>
                    <span className="result-tournament">
                      <span aria-hidden="true">{m.tournament?.gameType?.icon}</span> {m.tournament?.name}
                    </span>
                  </div>
                  <div className="result-score-pill">
                    <span className="my-score">{myScore}</span>
                    <span className="score-sep" aria-hidden="true">-</span>
                    <span className="their-score">{theirScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Players ────────────────────────────── */}
      <section className="dash-card card-players" aria-label="Jugadores del equipo">
        <div className="dash-card-header">
          <span className="card-emoji" aria-hidden="true">🌟</span>
          <h2>Nuestro Equipo</h2>
        </div>
        {team.players?.length === 0 ? (
          <div className="card-empty">
            <span className="card-empty-emoji" aria-hidden="true">👤</span>
            <p>Sin jugadores todavía</p>
          </div>
        ) : (
          <div className="players-grid">
            {team.players?.map((p, i) => (
              <div key={p.id} className="player-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="player-card-avatar" aria-hidden="true" style={{
                  background: [
                    'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    'linear-gradient(135deg, #ec4899, #f43f5e)',
                    'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    'linear-gradient(135deg, #10b981, #14b8a6)',
                    'linear-gradient(135deg, #f59e0b, #ef4444)',
                    'linear-gradient(135deg, #a855f7, #ec4899)',
                  ][i % 6]
                }}>
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div className="player-card-info">
                  <span className="player-card-name">{p.firstName} {p.lastName}</span>
                  {p.nickname && <span className="player-card-nick">"{p.nickname}"</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Refresh button (mobile) ────────────── */}
      <div className="refresh-area">
        <button className="btn btn-ghost btn-sm" onClick={refresh} aria-label="Actualizar datos">
          🔄 Actualizar
        </button>
      </div>
    </section>
  );
}
