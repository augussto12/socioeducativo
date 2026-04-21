import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeam, updateTeamProfile } from '../../api/teams.api';
import { getTournamentsByTeam, getStandings } from '../../api/tournaments.api';
import { getNextMatch, getRecentResults } from '../../api/matches.api';
import { useToast } from '../../hooks/useToast';
import ReactMarkdown from 'react-markdown';
import './TeamDashboard.css';

export default function TeamDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [activeStandings, setActiveStandings] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ shieldUrl: '', descriptionMd: '' });
  const toast = useToast();

  useEffect(() => {
    if (!user?.teamId) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
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

      const activeTs = (tourneysRes.data || []).filter(t => t.status === 'IN_PROGRESS');
      const standingsMap = {};
      for (const t of activeTs) {
        try {
          const sRes = await getStandings(t.id);
          standingsMap[t.id] = sRes.data;
        } catch { /* ignore */ }
      }
      setActiveStandings(standingsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateTeamProfile(user.teamId, profileForm);
      toast.success('¡Perfil actualizado! 🎉');
      setEditingProfile(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  if (loading) {
    return (
      <div className="team-loading">
        <div className="team-loading-emoji">⚽</div>
        <p>Cargando tu equipo...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-loading">
        <div className="team-loading-emoji">😢</div>
        <p>Equipo no encontrado</p>
      </div>
    );
  }

  const getOutcome = (match) => {
    if (!match.result) return null;
    const isHome = match.homeTeamId === user.teamId;
    const myScore = isHome ? match.result.homeScore : match.result.awayScore;
    const theirScore = isHome ? match.result.awayScore : match.result.homeScore;
    if (myScore > theirScore) return 'W';
    if (myScore < theirScore) return 'L';
    return 'D';
  };

  return (
    <div className="team-dash">
      <toast.ToastContainer />

      {/* ─── Hero Banner ────────────────────────── */}
      <div className="hero-banner">
        <div className="hero-confetti">
          {['🏆', '⭐', '🎯', '🔥', '💪', '⚡'].map((e, i) => (
            <span key={i} className={`confetti-item confetti-${i + 1}`}>{e}</span>
          ))}
        </div>

        <div className="hero-shield-area">
          {team.shieldUrl ? (
            <img src={team.shieldUrl.startsWith('http') ? team.shieldUrl : `http://localhost:3001${team.shieldUrl}`} alt={team.name} className="hero-shield-img" />
          ) : (
            <div className="hero-shield-placeholder">
              {team.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="hero-team-name">{team.name}</h1>

        {team.descriptionMd && (
          <div className="hero-desc">
            <ReactMarkdown>{team.descriptionMd.replace(/^##?\s.+$/gm, '').trim()}</ReactMarkdown>
          </div>
        )}

        <div className="hero-stats-row">
          <div className="hero-stat">
            <span className="hero-stat-num">{team.players?.length || 0}</span>
            <span className="hero-stat-label">👥 Jugadores</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">{tournaments.length || 0}</span>
            <span className="hero-stat-label">🏆 Torneos</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">{recentResults.length || 0}</span>
            <span className="hero-stat-label">🎮 Partidos</span>
          </div>
        </div>

        <button className="edit-profile-btn" onClick={() => {
          setProfileForm({ shieldUrl: team.shieldUrl || '', descriptionMd: team.descriptionMd || '' });
          setEditingProfile(true);
        }}>
          ✏️ Editar Perfil
        </button>
      </div>

      {/* ─── Next Match Spotlight ───────────────── */}
      {nextMatch && (
        <div className="next-match-spotlight">
          <div className="spotlight-label">
            <span className="spotlight-pulse"></span>
            ⚡ PRÓXIMO PARTIDO
          </div>
          <div className="spotlight-matchup">
            <div className="spotlight-team">
              <div className="spotlight-shield">{nextMatch.homeTeam?.name?.substring(0, 2)}</div>
              <span className="spotlight-name">{nextMatch.homeTeam?.name}</span>
            </div>
            <div className="spotlight-vs">
              <span>VS</span>
            </div>
            <div className="spotlight-team">
              <div className="spotlight-shield">{nextMatch.awayTeam?.name?.substring(0, 2)}</div>
              <span className="spotlight-name">{nextMatch.awayTeam?.name}</span>
            </div>
          </div>
          <div className="spotlight-meta">
            {nextMatch.tournament?.gameType?.icon} {nextMatch.tournament?.name}
            {nextMatch.scheduledAt && ` · 📅 ${new Date(nextMatch.scheduledAt).toLocaleDateString('es-AR')}`}
          </div>
        </div>
      )}

      {/* ─── Two Column Grid ───────────────────── */}
      <div className="dash-grid">

        {/* Recent Results */}
        <div className="dash-card card-results">
          <div className="dash-card-header">
            <span className="card-emoji">📊</span>
            <h2>Últimos Resultados</h2>
          </div>
          {recentResults.length === 0 ? (
            <div className="card-empty">
              <span className="card-empty-emoji">🎮</span>
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
                    <div className={`result-badge ${outcome === 'W' ? 'badge-win-fun' : outcome === 'L' ? 'badge-loss-fun' : 'badge-draw-fun'}`}>
                      {outcome === 'W' ? '🏅' : outcome === 'L' ? '😤' : '🤝'}
                    </div>
                    <div className="result-info">
                      <span className="result-opponent">vs {opponent?.name}</span>
                      <span className="result-tournament">{m.tournament?.gameType?.icon} {m.tournament?.name}</span>
                    </div>
                    <div className="result-score-pill">
                      <span className="my-score">{myScore}</span>
                      <span className="score-sep">-</span>
                      <span className="their-score">{theirScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Players */}
        <div className="dash-card card-players">
          <div className="dash-card-header">
            <span className="card-emoji">🌟</span>
            <h2>Nuestro Equipo</h2>
          </div>
          {team.players?.length === 0 ? (
            <div className="card-empty">
              <span className="card-empty-emoji">👤</span>
              <p>Sin jugadores todavía</p>
            </div>
          ) : (
            <div className="players-grid">
              {team.players?.map((p, i) => (
                <div key={p.id} className="player-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="player-card-avatar" style={{
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
        </div>
      </div>

      {/* ─── Tournament Standings ──────────────── */}
      {tournaments.map((tournament) => {
        const standings = activeStandings[tournament.id];
        if (!standings || standings.length === 0) return null;

        return (
          <div key={tournament.id} className="dash-card card-standings">
            <div className="dash-card-header">
              <span className="card-emoji">{tournament.gameType?.icon || '🏆'}</span>
              <h2>{tournament.name}</h2>
              <span className="standings-badge">📊 Tabla</span>
            </div>
            <div className="standings-table-wrap">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Equipo</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>DIF</th>
                    <th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => {
                    const isUs = s.teamId === user.teamId;
                    return (
                      <tr key={s.id} className={isUs ? 'standings-highlight' : ''}>
                        <td>
                          <span className={`position-badge pos-${i + 1}`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : s.position}
                          </span>
                        </td>
                        <td>
                          <span className={`standings-team-name ${isUs ? 'is-us' : ''}`}>
                            {isUs && '👉 '}{s.team?.name}{isUs && ' (Nosotros!)'}
                          </span>
                        </td>
                        <td>{s.played}</td>
                        <td className="td-wins">{s.wins}</td>
                        <td>{s.draws}</td>
                        <td className="td-losses">{s.losses}</td>
                        <td className={s.pointsDiff > 0 ? 'td-positive' : s.pointsDiff < 0 ? 'td-negative' : ''}>
                          {s.pointsDiff > 0 ? '+' : ''}{s.pointsDiff}
                        </td>
                        <td className="td-points">{s.totalPoints}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* ─── Tournaments List ──────────────────── */}
      {tournaments.length > 0 && (
        <div className="dash-card card-tournaments">
          <div className="dash-card-header">
            <span className="card-emoji">🎯</span>
            <h2>Mis Torneos</h2>
          </div>
          <div className="tournaments-fun-list">
            {tournaments.map((t) => {
              const statusEmoji = { DRAFT: '📝', INSCRIPTIONS_OPEN: '✍️', IN_PROGRESS: '🔥', FINISHED: '🏅', CANCELLED: '❌' };
              const statusText = { DRAFT: 'Preparando', INSCRIPTIONS_OPEN: 'Inscripciones', IN_PROGRESS: '¡En Juego!', FINISHED: 'Terminado', CANCELLED: 'Cancelado' };
              return (
                <div key={t.id} className="tournament-fun-item">
                  <span className="tournament-fun-icon">{t.gameType?.icon || '🎮'}</span>
                  <div className="tournament-fun-info">
                    <span className="tournament-fun-name">{t.name}</span>
                    <span className="tournament-fun-format">
                      {t.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación'}
                    </span>
                  </div>
                  <span className={`tournament-fun-status status-${t.status?.toLowerCase()}`}>
                    {statusEmoji[t.status]} {statusText[t.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Edit Profile Modal ────────────────── */}
      {editingProfile && (
        <div className="modal-overlay" onClick={() => setEditingProfile(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#1a1040', border: '2px solid rgba(139,92,246,0.3)' }}>
            <div className="modal-header">
              <h2>✏️ Editar Perfil del Equipo</h2>
              <button className="modal-close" onClick={() => setEditingProfile(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">URL del Escudo 🛡️</label>
              <input className="form-input" value={profileForm.shieldUrl} onChange={(e) => setProfileForm({ ...profileForm, shieldUrl: e.target.value })} placeholder="https://ejemplo.com/escudo.png" />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Descripción del Equipo 📝</label>
              <textarea className="form-textarea" value={profileForm.descriptionMd} onChange={(e) => setProfileForm({ ...profileForm, descriptionMd: e.target.value })} rows={6} placeholder="Contá algo de tu equipo...&#10;&#10;Pueden usar **negrita** y *cursiva*!" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditingProfile(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveProfile}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
