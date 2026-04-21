import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournament, getStandings } from '../../api/tournaments.api';
import { getMatchesByTournament, recordResult, editResult, changeMatchStatus } from '../../api/matches.api';
import { useToast } from '../../hooks/useToast';
import './AdminCrud.css';
import './AdminMatches.css';

export default function AdminMatches() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(null);
  const [resultForm, setResultForm] = useState({ homeScore: 0, awayScore: 0 });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const toast = useToast();

  const load = async () => {
    try {
      const [tRes, mRes, sRes] = await Promise.all([
        getTournament(id),
        getMatchesByTournament(id, { limit: 200 }),
        getStandings(id),
      ]);
      setTournament(tRes.data);
      setMatches(mRes.data.matches);
      setStandings(sRes.data);
    } catch (err) {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleRecordResult = async () => {
    setSaving(true);
    try {
      const match = showResult;
      if (match.result) {
        await editResult(match.id, resultForm);
        toast.success('Resultado actualizado');
      } else {
        await recordResult(match.id, resultForm);
        toast.success('Resultado registrado');
      }
      setShowResult(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handlePostpone = async (match) => {
    if (!confirm('¿Postergar este partido?')) return;
    try {
      await changeMatchStatus(match.id, 'POSTPONED');
      toast.success('Partido postergado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleReactivate = async (match) => {
    try {
      await changeMatchStatus(match.id, 'PENDING');
      toast.success('Partido reactivado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const openResultModal = (match) => {
    setResultForm({
      homeScore: match.result?.homeScore || 0,
      awayScore: match.result?.awayScore || 0,
    });
    setShowResult(match);
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!tournament) return <div className="empty-state"><h3>Torneo no encontrado</h3></div>;

  // Group matches by round
  const matchesByRound = matches.reduce((acc, m) => {
    const r = m.round;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  return (
    <div className="admin-crud admin-matches">
      <toast.ToastContainer />

      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/tournaments')} style={{ marginBottom: '0.5rem' }}>
            ← Volver a Torneos
          </button>
          <h1 className="page-title">{tournament.gameType?.icon} {tournament.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {tournament.gameType?.name} · {tournament.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación Directa'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="matches-tabs">
        <button className={`matches-tab ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>
          📋 Partidos ({matches.length})
        </button>
        {tournament.format === 'ROUND_ROBIN' && (
          <button className={`matches-tab ${activeTab === 'standings' ? 'active' : ''}`} onClick={() => setActiveTab('standings')}>
            📊 Tabla de Posiciones
          </button>
        )}
      </div>

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="matches-content">
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <div key={round} className="match-round">
              <h3 className="match-round-title">Fecha {round}</h3>
              <div className="match-round-list">
                {roundMatches.map((match) => (
                  <div key={match.id} className={`match-card-admin ${match.status === 'PLAYED' ? 'played' : ''} ${match.status === 'POSTPONED' ? 'postponed' : ''}`}>
                    <div className="match-card-teams">
                      <div className="match-card-team">
                        {match.homeTeam?.shieldUrl ? (
                          <img src={match.homeTeam.shieldUrl.startsWith('http') ? match.homeTeam.shieldUrl : `http://localhost:3001${match.homeTeam.shieldUrl}`} className="team-shield" alt="" />
                        ) : (
                          <div className="team-shield-placeholder">{match.homeTeam?.name?.substring(0, 2)}</div>
                        )}
                        <span className="match-team-name">{match.homeTeam?.name || 'TBD'}</span>
                      </div>

                      <div className="match-card-score">
                        {match.result ? (
                          <span className="score-display">
                            {match.result.homeScore} <span className="score-vs">-</span> {match.result.awayScore}
                          </span>
                        ) : (
                          <span className="score-vs" style={{ fontSize: '0.9rem' }}>VS</span>
                        )}
                      </div>

                      <div className="match-card-team">
                        <span className="match-team-name">{match.awayTeam?.name || 'TBD'}</span>
                        {match.awayTeam?.shieldUrl ? (
                          <img src={match.awayTeam.shieldUrl.startsWith('http') ? match.awayTeam.shieldUrl : `http://localhost:3001${match.awayTeam.shieldUrl}`} className="team-shield" alt="" />
                        ) : (
                          <div className="team-shield-placeholder">{match.awayTeam?.name?.substring(0, 2)}</div>
                        )}
                      </div>
                    </div>

                    <div className="match-card-actions">
                      {match.status === 'POSTPONED' && (
                        <span className="badge badge-draw" style={{ marginRight: '0.5rem' }}>Postergado</span>
                      )}
                      {match.status !== 'POSTPONED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openResultModal(match)}>
                          {match.result ? '✏️ Editar' : '📝 Resultado'}
                        </button>
                      )}
                      {match.status === 'PENDING' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handlePostpone(match)}>⏸️</button>
                      )}
                      {match.status === 'POSTPONED' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleReactivate(match)}>▶️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Standings Tab */}
      {activeTab === 'standings' && (
        <div className="table-wrapper" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Equipo</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PE</th>
                <th>PP</th>
                <th>GF</th>
                <th>GC</th>
                <th>DIF</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.position}</strong></td>
                  <td>
                    <div className="flex-gap">
                      <div className="team-shield-placeholder" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                        {s.team?.name?.substring(0, 2)}
                      </div>
                      <strong>{s.team?.name}</strong>
                    </div>
                  </td>
                  <td>{s.played}</td>
                  <td style={{ color: 'var(--accent-success)' }}>{s.wins}</td>
                  <td>{s.draws}</td>
                  <td style={{ color: 'var(--accent-danger)' }}>{s.losses}</td>
                  <td>{s.pointsFor}</td>
                  <td>{s.pointsAgainst}</td>
                  <td style={{ color: s.pointsDiff > 0 ? 'var(--accent-success)' : s.pointsDiff < 0 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                    {s.pointsDiff > 0 ? '+' : ''}{s.pointsDiff}
                  </td>
                  <td><strong style={{ fontSize: '1.1rem' }}>{s.totalPoints}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <div className="modal-overlay" onClick={() => setShowResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showResult.result ? 'Editar Resultado' : 'Cargar Resultado'}</h2>
              <button className="modal-close" onClick={() => setShowResult(null)}>×</button>
            </div>

            <div className="result-form">
              <div className="result-team">
                <div className="team-shield-placeholder">{showResult.homeTeam?.name?.substring(0, 2)}</div>
                <span>{showResult.homeTeam?.name}</span>
              </div>

              <div className="result-scores">
                <input
                  type="number"
                  className="result-score-input"
                  value={resultForm.homeScore}
                  onChange={(e) => setResultForm({ ...resultForm, homeScore: parseInt(e.target.value) || 0 })}
                  min={0}
                />
                <span className="score-vs" style={{ fontSize: '1.2rem' }}>—</span>
                <input
                  type="number"
                  className="result-score-input"
                  value={resultForm.awayScore}
                  onChange={(e) => setResultForm({ ...resultForm, awayScore: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="result-team">
                <div className="team-shield-placeholder">{showResult.awayTeam?.name?.substring(0, 2)}</div>
                <span>{showResult.awayTeam?.name}</span>
              </div>
            </div>

            <p className="confirm-text" style={{ textAlign: 'center', marginTop: '1rem' }}>
              ¿Estás seguro del resultado? Esta acción actualizará la tabla de posiciones.
            </p>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowResult(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRecordResult} disabled={saving}>
                {saving ? 'Guardando...' : '✅ Confirmar Resultado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
