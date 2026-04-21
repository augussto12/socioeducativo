import { useState, useEffect } from 'react';
import { getTeams, createTeam, deleteTeam, resetTeamPassword, toggleTeamActive } from '../../api/teams.api';
import { useToast } from '../../hooks/useToast';
import './AdminCrud.css';

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({ name: '', shieldUrl: '', descriptionMd: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadTeams = async () => {
    try {
      const { data } = await getTeams({ limit: 100 });
      setTeams(data.teams);
    } catch (err) {
      toast.error('Error cargando equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeams(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('El nombre es requerido');
    setSaving(true);
    try {
      const { data } = await createTeam(form);
      setCredentials(data.credentials);
      setForm({ name: '', shieldUrl: '', descriptionMd: '' });
      toast.success(`Equipo "${data.team.name}" creado`);
      loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creando equipo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team) => {
    if (!confirm(`¿Eliminar equipo "${team.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteTeam(team.id);
      toast.success('Equipo eliminado');
      loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error eliminando equipo');
    }
  };

  const handleResetPassword = async (team) => {
    if (!confirm(`¿Resetear contraseña del equipo "${team.name}"?`)) return;
    try {
      const { data } = await resetTeamPassword(team.id);
      setCredentials(data);
      toast.success('Contraseña reseteada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error reseteando contraseña');
    }
  };

  const handleToggleActive = async (team) => {
    try {
      await toggleTeamActive(team.id);
      toast.success(`Usuario ${team.user?.isActive ? 'desactivado' : 'activado'}`);
      loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="admin-crud">
      <toast.ToastContainer />

      <div className="page-header">
        <h1 className="page-title">🛡️ Equipos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Equipo
        </button>
      </div>

      {/* Credentials banner */}
      {credentials && (
        <div className="credentials-banner animate-slide-up">
          <div className="credentials-header">
            <span>🔑 Credenciales generadas</span>
            <button className="modal-close" onClick={() => setCredentials(null)}>×</button>
          </div>
          <div className="credentials-body">
            <div><strong>Usuario:</strong> <code>{credentials.username}</code></div>
            <div><strong>Contraseña:</strong> <code>{credentials.password}</code></div>
          </div>
          <p className="credentials-warning">⚠️ Guardá estas credenciales. La contraseña no se mostrará de nuevo.</p>
        </div>
      )}

      {/* Teams table */}
      {teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <h3>Sin equipos todavía</h3>
          <p>Creá el primer equipo con el botón de arriba</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Usuario</th>
                <th>Jugadores</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <div className="flex-gap">
                      {team.shieldUrl ? (
                        <img src={team.shieldUrl.startsWith('http') ? team.shieldUrl : `http://localhost:3001${team.shieldUrl}`} className="team-shield" alt="" />
                      ) : (
                        <div className="team-shield-placeholder">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <strong>{team.name}</strong>
                    </div>
                  </td>
                  <td><code style={{ fontSize: '0.8rem' }}>{team.user?.username || '—'}</code></td>
                  <td>{team._count?.players || 0}</td>
                  <td>
                    <span className={`badge ${team.user?.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {team.user?.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleResetPassword(team)} title="Resetear contraseña">
                        🔑
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(team)} title="Activar/Desactivar">
                        {team.user?.isActive ? '🚫' : '✅'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(team)} title="Eliminar" style={{ color: 'var(--accent-danger)' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Equipo</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Nombre del Equipo *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Los Halcones"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">URL del Escudo (opcional)</label>
                <input
                  className="form-input"
                  value={form.shieldUrl}
                  onChange={(e) => setForm({ ...form, shieldUrl: e.target.value })}
                  placeholder="https://ejemplo.com/escudo.png"
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Descripción (Markdown)</label>
                <textarea
                  className="form-textarea"
                  value={form.descriptionMd}
                  onChange={(e) => setForm({ ...form, descriptionMd: e.target.value })}
                  placeholder="## Mi Equipo&#10;Descripción con **Markdown**"
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
