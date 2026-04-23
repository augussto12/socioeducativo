import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams, createTeam, deleteTeam, resetTeamPassword, toggleTeamActive } from '../../api/teams.api';
import { useToast } from '../../hooks/useToast';
import SkeletonLoader from '../../components/SkeletonLoader';
import './AdminCrud.css';

export default function AdminTeams() {
  const navigate = useNavigate();
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

  if (loading) return <SkeletonLoader variant="full-page" />;

  return (
    <div className="admin-crud">
      <toast.ToastContainer />

      <div className="page-header">
        <h1 className="page-title">🛡️ Equipos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} aria-label="Crear nuevo equipo">
          + Nuevo Equipo
        </button>
      </div>

      {/* Credentials banner */}
      {credentials && (
        <div className="credentials-banner animate-slide-up">
          <div className="credentials-header">
            <span>🔑 Credenciales generadas</span>
            <button className="modal-close" onClick={() => setCredentials(null)} aria-label="Cerrar credenciales">×</button>
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
        <div className="mobile-card-list">
          {teams.map((team) => (
            <div key={team.id} className="mobile-card">
              <div className="mobile-card-main">
                <div className="mobile-card-identity">
                  {team.shieldUrl ? (
                    <img src={team.shieldUrl.startsWith('http') ? team.shieldUrl : `${window.location.origin}${team.shieldUrl}`} className="team-shield" alt="" loading="lazy" width="40" height="40" />
                  ) : (
                    <div className="team-shield-placeholder" aria-hidden="true">
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="mobile-card-name-block">
                    <strong className="mobile-card-name">{team.name}</strong>
                    <code className="mobile-card-username">{team.user?.username || '—'}</code>
                  </div>
                </div>
                <span className={`badge ${team.user?.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {team.user?.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="mobile-card-footer">
                <span className="mobile-card-meta" onClick={() => navigate(`/admin/teams/${team.id}/players`)} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }} role="link" tabIndex={0}>
                  👥 {team._count?.players || 0} jugadores
                </span>
                <div className="mobile-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleResetPassword(team)} aria-label={`Resetear contraseña de ${team.name}`}>
                    🔑
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(team)} aria-label={`${team.user?.isActive ? 'Desactivar' : 'Activar'} ${team.name}`}>
                    {team.user?.isActive ? '🚫' : '✅'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(team)} aria-label={`Eliminar ${team.name}`} style={{ color: 'var(--accent-danger)' }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Equipo</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">×</button>
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
