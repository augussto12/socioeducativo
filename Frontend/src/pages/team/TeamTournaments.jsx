/**
 * TeamTournaments — List of team's tournaments with fixture detail.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTournamentsByTeam } from '../../api/tournaments.api';
import { getMatchesByTournament } from '../../api/matches.api';
import FixtureView from '../../components/FixtureView';
import SkeletonLoader from '../../components/SkeletonLoader';
import './TeamTournaments.css';

export default function TeamTournaments() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFixture, setLoadingFixture] = useState(false);
  const [error, setError] = useState(null);

  const loadTournaments = useCallback(async () => {
    if (!user?.teamId) return;
    try {
      setError(null);
      const res = await getTournamentsByTeam(user.teamId).catch(() => ({ data: [] }));
      setTournaments(res.data || []);
    } catch {
      setError('Error cargando torneos');
    } finally {
      setLoading(false);
    }
  }, [user?.teamId]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleSelectTournament = useCallback(async (tournament) => {
    if (selectedTournament?.id === tournament.id) {
      setSelectedTournament(null);
      setMatches([]);
      return;
    }
    setSelectedTournament(tournament);
    setLoadingFixture(true);
    try {
      const res = await getMatchesByTournament(tournament.id, { limit: 200 });
      setMatches(res.data.matches || []);
    } catch {
      setMatches([]);
    } finally {
      setLoadingFixture(false);
    }
  }, [selectedTournament?.id]);

  const statusEmoji = { DRAFT: '📝', INSCRIPTIONS_OPEN: '✍️', IN_PROGRESS: '🔥', FINISHED: '🏅', CANCELLED: '❌' };
  const statusText = { DRAFT: 'Preparando', INSCRIPTIONS_OPEN: 'Inscripciones', IN_PROGRESS: '¡En Juego!', FINISHED: 'Terminado', CANCELLED: 'Cancelado' };

  if (loading) return <SkeletonLoader variant="full-page" />;

  if (error) {
    return (
      <div className="team-error-state">
        <span className="emoji-decorative" aria-hidden="true">😢</span>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadTournaments}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <section className="team-tournaments-page" aria-label="Mis torneos">
      <div className="tournaments-page-header">
        <h1 className="tournaments-page-title">
          <span aria-hidden="true">🏆</span> Mis Torneos
        </h1>
      </div>

      {tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">🏆</div>
          <h3>Sin torneos todavía</h3>
          <p>Cuando te inscriban en un torneo, aparecerá acá</p>
        </div>
      ) : (
        <div className="tournaments-card-list">
          {tournaments.map((t) => {
            const isSelected = selectedTournament?.id === t.id;
            return (
              <article key={t.id} className={`tournament-card-item ${isSelected ? 'selected' : ''}`}>
                <button
                  className="tournament-card-btn"
                  onClick={() => handleSelectTournament(t)}
                  aria-expanded={isSelected}
                  aria-label={`Ver fixture de ${t.name}`}
                >
                  <span className="tournament-card-icon" aria-hidden="true">{t.gameType?.icon || '🎮'}</span>
                  <div className="tournament-card-info">
                    <span className="tournament-card-name">{t.name}</span>
                    <span className="tournament-card-format">
                      {t.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación'}
                    </span>
                  </div>
                  <span className={`tournament-card-status status-${t.status?.toLowerCase()}`}>
                    <span aria-hidden="true">{statusEmoji[t.status]}</span> {statusText[t.status]}
                  </span>
                </button>

                {isSelected && (
                  <div className="tournament-fixture-area">
                    {loadingFixture ? (
                      <SkeletonLoader variant="card" count={3} />
                    ) : (
                      <FixtureView
                        matches={matches}
                        format={t.format}
                        highlightTeamId={user.teamId}
                      />
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
