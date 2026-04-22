import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournament, getStandings } from '../../api/tournaments.api';
import { getMatchesByTournament, recordResult, editResult, changeMatchStatus } from '../../api/matches.api';
import { useToast } from '../../hooks/useToast';
import StandingsTable from '../../components/StandingsTable';
import SkeletonLoader from '../../components/SkeletonLoader';
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

  const load = useCallback(async () => {
    try {
      const [tRes, mRes, sRes] = await Promise.all([
        getTournament(id),
        getMatchesByTournament(id, { limit: 200 }),
        getStandings(id),
      ]);
      setTournament(tRes.data);
      setMatches(mRes.data.matches);
      setStandings(sRes.data);
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  const handleRecordResult = useCallback(async () => {
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
  }, [showResult, resultForm, load, toast]);

  const handlePostpone = useCallback(async (match) => {
    if (!confirm('¿Postergar este partido?')) return;
    try {
      await changeMatchStatus(match.id, 'POSTPONED');
      toast.success('Partido postergado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }, [load, toast]);

  const handleReactivate = useCallback(async (match) => {
    try {
      await changeMatchStatus(match.id, 'PENDING');
      toast.success('Partido reactivado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }, [load, toast]);

  const openResultModal = useCallback((match) => {
    setResultForm({
      homeScore: match.result?.homeScore || 0,
      awayScore: match.result?.awayScore || 0,
    });
    setShowResult(match);
  }, []);

  if (loading) return <SkeletonLoader variant="full-page" />;
  if (!tournament) return <div className="empty-state"><h3>Torneo no encontrado</h3></div>;

  const matchesByRound = matches.reduce((acc, m) => {
    const r = m.round;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  return (
    <section className="admin-crud admin-matches" aria-label="Gestión de partidos">
      <toast.ToastContainer />

      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/tournaments')} aria-label="Volver a torneos">
            ← Volver a Torneos
          </button>
          <h1 className="page-title">
            <span aria-hidden="true">{tournament.gameType?.icon}</span> {tournament.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {tournament.gameType?.name} · {tournament.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación Directa'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="matches-tabs" role="tablist">
        <button
          className={`matches-tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
          role="tab"
          aria-selected={activeTab === 'matches'}
        >
          <span aria-hidden="true">📋</span> Partidos ({matches.length})
        </button>
        {tournament.format === 'ROUND_ROBIN' && (
          <button
            className={`matches-tab ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
            role="tab"
            aria-selected={activeTab === 'standings'}
          >
            <span aria-hidden="true">📊</span> Posiciones
          </button>
        )}
      </div>

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="matches-content" role="tabpanel">
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <div key={round} className="match-round">
              <h3 className="match-round-title">Fecha {round}</h3>
              <div className="match-round-list">
                {roundMatches.map((match) => (
                  <div key={match.id} className={`match-card-admin ${match.status === 'PLAYED' ? 'played' : ''} ${match.status === 'POSTPONED' ? 'postponed' : ''}`}>
                    <div className="match-card-teams">
                      <div className="match-card-team">
                        {match.homeTeam?.shieldUrl ? (
                          <img
                            src={match.homeTeam.shieldUrl.startsWith('http') ? match.homeTeam.shieldUrl : `${window.location.origin}${match.homeTeam.shieldUrl}`}
                            className="team-shield"
                            alt=""
                            loading="lazy"
                            width="40"
                            height="40"
                          />
                        ) : (
                          <div className="team-shield-placeholder" aria-hidden="true">{match.homeTeam?.name?.substring(0, 2)}</div>
                        )}
                        <span className="match-team-name">{match.homeTeam?.name || 'TBD'}</span>
                      </div>

                      <div className="match-card-score">
                        {match.result ? (
                          <span className="score-display">
                            {match.result.homeScore} <span className="score-vs" aria-hidden="true">-</span> {match.result.awayScore}
                          </span>
                        ) : (
                          <span className="score-vs" aria-hidden="true">VS</span>
                        )}
                      </div>

                      <div className="match-card-team">
                        <span className="match-team-name">{match.awayTeam?.name || 'TBD'}</span>
                        {match.awayTeam?.shieldUrl ? (
                          <img
                            src={match.awayTeam.shieldUrl.startsWith('http') ? match.awayTeam.shieldUrl : `${window.location.origin}${match.awayTeam.shieldUrl}`}
                            className="team-shield"
                            alt=""
                            loading="lazy"
                            width="40"
                            height="40"
                          />
                        ) : (
                          <div className="team-shield-placeholder" aria-hidden="true">{match.awayTeam?.name?.substring(0, 2)}</div>
                        )}
                      </div>
                    </div>

                    <div className="match-card-actions">
                      {match.status === 'POSTPONED' && (
                        <span className="badge badge-draw">Postergado</span>
                      )}
                      {match.status !== 'POSTPONED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openResultModal(match)} aria-label={match.result ? 'Editar resultado' : 'Cargar resultado'}>
                          {match.result ? '✏️ Editar' : '📝 Resultado'}
                        </button>
                      )}
                      {match.status === 'PENDING' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handlePostpone(match)} aria-label="Postergar partido">
                          ⏸️
                        </button>
                      )}
                      {match.status === 'POSTPONED' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleReactivate(match)} aria-label="Reactivar partido">
                          ▶️
                        </button>
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
        <div role="tabpanel">
          <StandingsTable standings={standings} />
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <div className="modal-overlay" onClick={() => setShowResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Cargar resultado">
            <div className="modal-header">
              <h2>{showResult.result ? 'Editar Resultado' : 'Cargar Resultado'}</h2>
              <button className="modal-close" onClick={() => setShowResult(null)} aria-label="Cerrar">×</button>
            </div>

            <div className="result-form">
              <div className="result-team">
                <div className="team-shield-placeholder" aria-hidden="true">{showResult.homeTeam?.name?.substring(0, 2)}</div>
                <span>{showResult.homeTeam?.name}</span>
              </div>

              <div className="result-scores">
                <label className="sr-only" htmlFor="home-score">Puntos local</label>
                <input
                  id="home-score"
                  type="number"
                  className="result-score-input"
                  value={resultForm.homeScore}
                  onChange={(e) => setResultForm({ ...resultForm, homeScore: parseInt(e.target.value) || 0 })}
                  min={0}
                />
                <span className="score-vs" aria-hidden="true">—</span>
                <label className="sr-only" htmlFor="away-score">Puntos visitante</label>
                <input
                  id="away-score"
                  type="number"
                  className="result-score-input"
                  value={resultForm.awayScore}
                  onChange={(e) => setResultForm({ ...resultForm, awayScore: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="result-team">
                <div className="team-shield-placeholder" aria-hidden="true">{showResult.awayTeam?.name?.substring(0, 2)}</div>
                <span>{showResult.awayTeam?.name}</span>
              </div>
            </div>

            <p className="confirm-text" style={{ textAlign: 'center' }}>
              ¿Estás seguro del resultado? Esta acción actualizará la tabla de posiciones.
            </p>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleRecordResult} disabled={saving}>
                {saving ? 'Guardando...' : '✅ Confirmar Resultado'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowResult(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
