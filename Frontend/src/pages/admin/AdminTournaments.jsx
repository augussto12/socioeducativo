import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments, createTournament, deleteTournament, enrollTeams, generateFixture, confirmFixture, getGameTypes } from '../../api/tournaments.api';
import { getTeams } from '../../api/teams.api';
import { useToast } from '../../hooks/useToast';
import SkeletonLoader from '../../components/SkeletonLoader';
import './AdminCrud.css';

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEnroll, setShowEnroll] = useState(null);
  const [showFixture, setShowFixture] = useState(null);
  const [fixturePreview, setFixturePreview] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [form, setForm] = useState({
    name: '', gameTypeId: '', format: 'ROUND_ROBIN', roundRobinReturn: false,
    pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, startDate: '', description: '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [tourneysRes, gamesRes, teamsRes] = await Promise.all([
        getTournaments({ limit: 50 }),
        getGameTypes(),
        getTeams({ limit: 100 }),
      ]);
      setTournaments(tourneysRes.data.tournaments);
      setGameTypes(gamesRes.data);
      setTeams(teamsRes.data.teams);
    } catch { toast.error('Error cargando datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.gameTypeId || !form.format) return toast.error('Nombre, juego y formato son requeridos');
    setSaving(true);
    try {
      await createTournament(form);
      toast.success('Torneo creado');
      setShowModal(false);
      setForm({ name: '', gameTypeId: '', format: 'ROUND_ROBIN', roundRobinReturn: false, pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, startDate: '', description: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleEnroll = async () => {
    if (selectedTeams.length === 0) return toast.error('Seleccioná al menos un equipo');
    try {
      await enrollTeams(showEnroll.id, selectedTeams);
      toast.success(`${selectedTeams.length} equipos inscriptos`);
      setShowEnroll(null);
      setSelectedTeams([]);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleGenerateFixture = async (tournament) => {
    try {
      const { data } = await generateFixture(tournament.id);
      setFixturePreview(data);
      setShowFixture(tournament);
    } catch (err) { toast.error(err.response?.data?.error || 'Error generando fixture'); }
  };

  const handleConfirmFixture = async () => {
    try {
      await confirmFixture(showFixture.id);
      toast.success('Fixture confirmado. ¡El torneo está en curso!');
      setShowFixture(null);
      setFixturePreview(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (t) => {
    if (!confirm(`¿Eliminar torneo "${t.name}"?`)) return;
    try { await deleteTournament(t.id); toast.success('Torneo eliminado'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const toggleTeamSelection = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const statusLabel = { DRAFT: 'Borrador', INSCRIPTIONS_OPEN: 'Inscripciones', IN_PROGRESS: 'En Curso', FINISHED: 'Finalizado', CANCELLED: 'Cancelado' };
  const statusClass = { DRAFT: 'badge-pending', INSCRIPTIONS_OPEN: 'badge-draw', IN_PROGRESS: 'badge-active', FINISHED: 'badge-win', CANCELLED: 'badge-loss' };
  const formatLabel = { ROUND_ROBIN: 'Todos vs Todos', SINGLE_ELIMINATION: 'Eliminación Directa' };

  if (loading) return <SkeletonLoader variant="full-page" />;

  // Group fixture preview by round
  const fixtureRounds = fixturePreview?.fixtures?.reduce((acc, match) => {
    const round = match.round || match.bracketRound || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {}) || {};

  return (
    <div className="admin-crud">
      <toast.ToastContainer />

      <div className="page-header">
        <h1 className="page-title">🏆 Torneos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} aria-label="Crear nuevo torneo">+ Nuevo Torneo</button>
      </div>

      {tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>Sin torneos</h3>
          <p>Creá tu primer torneo</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Juego</th>
                <th>Formato</th>
                <th>Equipos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.gameType?.icon} {t.gameType?.name}</td>
                  <td>{formatLabel[t.format]}</td>
                  <td>{t._count?.tournamentTeams || 0}</td>
                  <td><span className={`badge ${statusClass[t.status]}`}>{statusLabel[t.status]}</span></td>
                  <td>
                    <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                      {['DRAFT', 'INSCRIPTIONS_OPEN'].includes(t.status) && (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setShowEnroll(t); setSelectedTeams([]); }} aria-label={`Inscribir equipos en ${t.name}`}>👥 Inscribir</button>
                      )}
                      {['DRAFT', 'INSCRIPTIONS_OPEN'].includes(t.status) && t._count?.tournamentTeams >= 2 && (
                        <button className="btn btn-success btn-sm" onClick={() => handleGenerateFixture(t)} aria-label={`Generar fixture de ${t.name}`}>⚡ Generar Fixture</button>
                      )}
                      {t.status === 'IN_PROGRESS' && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/tournaments/${t.id}`)} aria-label={`Ver partidos de ${t.name}`}>📋 Partidos</button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t)} style={{ color: 'var(--accent-danger)' }} aria-label={`Eliminar ${t.name}`}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>Nuevo Torneo</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Copa Ping Pong 2026" required autoFocus />
              </div>
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Juego *</label>
                  <select className="form-select" value={form.gameTypeId} onChange={(e) => setForm({ ...form, gameTypeId: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {gameTypes.map((gt) => (
                      <option key={gt.id} value={gt.id}>{gt.icon} {gt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Formato *</label>
                  <select className="form-select" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                    <option value="ROUND_ROBIN">Todos vs Todos</option>
                    <option value="SINGLE_ELIMINATION">Eliminación Directa</option>
                  </select>
                </div>
              </div>
              {form.format === 'ROUND_ROBIN' && (
                <div className="form-row" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" checked={form.roundRobinReturn} onChange={(e) => setForm({ ...form, roundRobinReturn: e.target.checked })} />
                      Ida y Vuelta
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pts Victoria / Empate / Derrota</label>
                    <div className="flex-gap">
                      <input type="number" className="form-input" style={{ width: 60 }} value={form.pointsPerWin} onChange={(e) => setForm({ ...form, pointsPerWin: parseInt(e.target.value) || 0 })} min={0} />
                      <span style={{ color: 'var(--text-muted)' }}>/</span>
                      <input type="number" className="form-input" style={{ width: 60 }} value={form.pointsPerDraw} onChange={(e) => setForm({ ...form, pointsPerDraw: parseInt(e.target.value) || 0 })} min={0} />
                      <span style={{ color: 'var(--text-muted)' }}>/</span>
                      <input type="number" className="form-input" style={{ width: 60 }} value={form.pointsPerLoss} onChange={(e) => setForm({ ...form, pointsPerLoss: parseInt(e.target.value) || 0 })} min={0} />
                    </div>
                  </div>
                </div>
              )}
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio</label>
                  <input type="date" className="form-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del torneo..." rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear Torneo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Teams Modal */}
      {showEnroll && (
        <div className="modal-overlay" onClick={() => setShowEnroll(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Inscribir Equipos — {showEnroll.name}</h2>
              <button className="modal-close" onClick={() => setShowEnroll(null)} aria-label="Cerrar">×</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Seleccioná los equipos a inscribir
            </p>
            <div className="chips-container">
              {teams.map((team) => (
                <span key={team.id} className={`chip ${selectedTeams.includes(team.id) ? 'selected' : ''}`} onClick={() => toggleTeamSelection(team.id)}>
                  {team.name}
                </span>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowEnroll(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleEnroll} disabled={selectedTeams.length === 0}>
                Inscribir {selectedTeams.length} equipo{selectedTeams.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixture Preview Modal */}
      {showFixture && fixturePreview && (
        <div className="modal-overlay" onClick={() => { setShowFixture(null); setFixturePreview(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Preview del Fixture — {showFixture.name}</h2>
              <button className="modal-close" onClick={() => { setShowFixture(null); setFixturePreview(null); }} aria-label="Cerrar">×</button>
            </div>
            <div className="fixture-preview">
              {Object.entries(fixtureRounds).map(([round, matches]) => (
                <div key={round} className="fixture-round">
                  <div className="fixture-round-title">Ronda {round}</div>
                  {matches.filter(m => !m.isBye).map((match, idx) => (
                    <div key={idx} className="fixture-match">
                      <div className="fixture-team">{match.homeTeam?.name || 'TBD'}</div>
                      <div className="fixture-vs">VS</div>
                      <div className="fixture-team">{match.awayTeam?.name || 'TBD'}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => handleGenerateFixture(showFixture)}>🔄 Regenerar</button>
              <button className="btn btn-ghost" onClick={() => { setShowFixture(null); setFixturePreview(null); }}>Cancelar</button>
              <button className="btn btn-success" onClick={handleConfirmFixture}>✅ Confirmar Fixture</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
