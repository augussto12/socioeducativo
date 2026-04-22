/**
 * TeamStandings — Standings page for all active tournaments the team is in.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTournamentsByTeam, getStandings } from '../../api/tournaments.api';
import StandingsTable from '../../components/StandingsTable';
import SkeletonLoader from '../../components/SkeletonLoader';
import './TeamStandings.css';

export default function TeamStandings() {
  const { user } = useAuth();
  const [tournamentStandings, setTournamentStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?.teamId) return;
    try {
      setError(null);
      const tourneysRes = await getTournamentsByTeam(user.teamId).catch(() => ({ data: [] }));
      const tournaments = tourneysRes.data || [];
      const activeTs = tournaments.filter(t => t.status === 'IN_PROGRESS' || t.status === 'FINISHED');

      const results = [];
      for (const t of activeTs) {
        try {
          const sRes = await getStandings(t.id);
          if (sRes.data?.length > 0) {
            results.push({ tournament: t, standings: sRes.data });
          }
        } catch { /* skip */ }
      }
      setTournamentStandings(results);
    } catch {
      setError('Error cargando posiciones');
    } finally {
      setLoading(false);
    }
  }, [user?.teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <SkeletonLoader variant="full-page" />;
  }

  if (error) {
    return (
      <div className="team-error-state">
        <span className="emoji-decorative" aria-hidden="true">😢</span>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <section className="team-standings-page" aria-label="Tabla de posiciones">
      <div className="standings-page-header">
        <h1 className="standings-page-title">
          <span aria-hidden="true">📊</span> Posiciones
        </h1>
      </div>

      {tournamentStandings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📊</div>
          <h3>Sin posiciones todavía</h3>
          <p>Las posiciones aparecerán cuando tus torneos estén en curso</p>
        </div>
      ) : (
        <div className="standings-tournaments-list">
          {tournamentStandings.map(({ tournament, standings }) => (
            <article key={tournament.id} className="standings-tournament-card">
              <div className="standings-tournament-header">
                <span aria-hidden="true">{tournament.gameType?.icon || '🏆'}</span>
                <h2>{tournament.name}</h2>
                <span className={`badge ${tournament.status === 'IN_PROGRESS' ? 'badge-active' : 'badge-win'}`}>
                  {tournament.status === 'IN_PROGRESS' ? '🔥 En Juego' : '🏅 Terminado'}
                </span>
              </div>
              <StandingsTable
                standings={standings}
                highlightTeamId={user.teamId}
              />
            </article>
          ))}
        </div>
      )}

      <div className="refresh-area">
        <button className="btn btn-ghost btn-sm" onClick={loadData} aria-label="Actualizar posiciones">
          🔄 Actualizar
        </button>
      </div>
    </section>
  );
}
