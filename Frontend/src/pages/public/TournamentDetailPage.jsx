import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournament, getStandings } from '../../api/tournaments.api';
import { getMatchesByTournament } from '../../api/matches.api';
import StandingsTable from '../../components/StandingsTable';
import FixtureView from '../../components/FixtureView';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings');

  useEffect(() => {
    async function load() {
      try {
        const [tRes, sRes, mRes] = await Promise.all([
          getTournament(id),
          getStandings(id),
          getMatchesByTournament(id, { limit: 200 }),
        ]);
        setTournament(tRes.data);
        setStandings(sRes.data);
        setMatches(mRes.data.matches);
      } catch (err) {
        /* handled by empty states */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <SkeletonLoader variant="full-page" />;
  if (!tournament) {
    return (
      <div className="loading-page">
        <h3>Torneo no encontrado</h3>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Volver</button>
      </div>
    );
  }

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-md)' }} aria-label={`Detalle del torneo ${tournament.name}`}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} aria-label="Volver" style={{ marginBottom: 'var(--space-md)' }}>
        ← Volver
      </button>

      <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }} aria-hidden="true">{tournament.gameType?.icon}</div>
        <h1 className="page-title">{tournament.name}</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)', fontSize: 'var(--text-sm)' }}>
          {tournament.gameType?.name} · {tournament.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación Directa'}
          · {tournament.tournamentTeams?.length || 0} equipos
        </p>
      </div>

      <div className="matches-tabs" role="tablist">
        <button
          className={`matches-tab ${activeTab === 'standings' ? 'active' : ''}`}
          onClick={() => setActiveTab('standings')}
          role="tab"
          aria-selected={activeTab === 'standings'}
        >
          <span aria-hidden="true">📊</span> Posiciones
        </button>
        <button
          className={`matches-tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
          role="tab"
          aria-selected={activeTab === 'matches'}
        >
          <span aria-hidden="true">📋</span> Fixture
        </button>
      </div>

      {activeTab === 'standings' && (
        <div role="tabpanel">
          <StandingsTable standings={standings} />
        </div>
      )}

      {activeTab === 'matches' && (
        <div role="tabpanel">
          <FixtureView matches={matches} format={tournament.format} />
        </div>
      )}
    </section>
  );
}
