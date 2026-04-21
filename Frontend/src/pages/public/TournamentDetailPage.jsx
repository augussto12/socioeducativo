import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournament, getStandings } from '../../api/tournaments.api';
import { getMatchesByTournament } from '../../api/matches.api';

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!tournament) return <div className="loading-page"><h3>Torneo no encontrado</h3></div>;

  const matchesByRound = matches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Volver</button>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{tournament.gameType?.icon}</div>
        <h1 className="page-title" style={{ fontSize: '1.75rem' }}>{tournament.name}</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {tournament.gameType?.name} · {tournament.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación Directa'}
          · {tournament.tournamentTeams?.length || 0} equipos
        </p>
      </div>

      <div className="matches-tabs" style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex' }}>
        <button className={`matches-tab ${activeTab === 'standings' ? 'active' : ''}`} onClick={() => setActiveTab('standings')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'standings' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', position: 'relative', fontFamily: 'var(--font-body)' }}>
          📊 Posiciones
          {activeTab === 'standings' && <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: 'var(--accent-primary)', borderRadius: '2px 2px 0 0' }}></div>}
        </button>
        <button className={`matches-tab ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'matches' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', position: 'relative', fontFamily: 'var(--font-body)' }}>
          📋 Fixture
          {activeTab === 'matches' && <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: 'var(--accent-primary)', borderRadius: '2px 2px 0 0' }}></div>}
        </button>
      </div>

      {activeTab === 'standings' && (
        <div style={{ overflow: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DIF</th><th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.position}</strong></td>
                  <td><strong>{s.team?.name}</strong></td>
                  <td>{s.played}</td>
                  <td style={{ color: 'var(--accent-success)' }}>{s.wins}</td>
                  <td>{s.draws}</td>
                  <td style={{ color: 'var(--accent-danger)' }}>{s.losses}</td>
                  <td>{s.pointsFor}</td>
                  <td>{s.pointsAgainst}</td>
                  <td style={{ color: s.pointsDiff > 0 ? 'var(--accent-success)' : s.pointsDiff < 0 ? 'var(--accent-danger)' : '' }}>
                    {s.pointsDiff > 0 ? '+' : ''}{s.pointsDiff}
                  </td>
                  <td><strong style={{ fontSize: '1.1rem' }}>{s.totalPoints}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'matches' && (
        <div>
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <div key={round} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem', borderLeft: '3px solid var(--accent-primary)' }}>
                Fecha {round}
              </h3>
              {roundMatches.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '0.4rem', borderLeft: m.status === 'PLAYED' ? '3px solid var(--accent-success)' : m.status === 'POSTPONED' ? '3px solid var(--accent-warning)' : '3px solid transparent' }}>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>{m.homeTeam?.name}</span>
                  <span style={{ margin: '0 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {m.result ? `${m.result.homeScore} - ${m.result.awayScore}` : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>vs</span>}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{m.awayTeam?.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
