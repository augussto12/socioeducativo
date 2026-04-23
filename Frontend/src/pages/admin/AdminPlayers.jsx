/**
 * AdminPlayers — Manage players for a specific team.
 * Accessed from AdminTeams via a "Ver Jugadores" button.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeam } from '../../api/teams.api';
import { getPlayersByTeam, createPlayer, updatePlayer, deletePlayer } from '../../api/players.api';
import { useToast } from '../../hooks/useToast';
import SkeletonLoader from '../../components/SkeletonLoader';
import './AdminCrud.css';

function isBirthday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export default function AdminPlayers() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', nickname: '', birthDate: '' });

  const load = useCallback(async () => {
    try {
      const [teamRes, playersRes] = await Promise.all([
        getTeam(teamId),
        getPlayersByTeam(teamId),
      ]);
      setTeam(teamRes.data);
      setPlayers(playersRes.data);
    } catch (err) {
      toast.error('Error cargando jugadores');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', nickname: '', birthDate: '' });
    setShowModal(true);
  };

  const openEdit = (player) => {
    setEditing(player);
    setForm({
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname || '',
      birthDate: player.birthDate ? player.birthDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error('Nombre y apellido son requeridos');
    }
    try {
      if (editing) {
        await updatePlayer(teamId, editing.id, form);
        toast.success('Jugador actualizado');
      } else {
        await createPlayer(teamId, form);
        toast.success('Jugador agregado');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando jugador');
    }
  };

  const handleDelete = async (player) => {
    if (!window.confirm(`¿Eliminar a ${player.firstName} ${player.lastName}?`)) return;
    try {
      await deletePlayer(teamId, player.id);
      toast.success('Jugador eliminado');
      load();
    } catch (err) {
      toast.error('Error eliminando jugador');
    }
  };

  if (loading) return <SkeletonLoader variant="full-page" />;

  return (
    <div className="admin-crud">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/teams')} style={{ marginBottom: 'var(--space-md)' }}>
        ← Volver a Equipos
      </button>

      <div className="page-header">
        <h1 className="page-title">
          👥 Jugadores — {team?.name}
        </h1>
        <button className="btn btn-primary" onClick={openCreate} aria-label="Agregar jugador">
          + Agregar Jugador
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)' }}>
        {players.length}/20 jugadores
      </p>

      {players.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">👥</div>
          <h3>Sin jugadores</h3>
          <p>Agregá jugadores a este equipo</p>
        </div>
      ) : (
        <div className="mobile-card-list">
          {players.map((p) => (
            <div key={p.id} className="mobile-card">
              <div className="mobile-card-main">
                <div className="mobile-card-identity">
                  <div className="player-avatar" aria-hidden="true">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="mobile-card-name-block">
                    <strong className="mobile-card-name">
                      {p.firstName} {p.lastName}
                    </strong>
                    {p.nickname && (
                      <span className="mobile-card-subtitle">"{p.nickname}"</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mobile-card-footer">
                <span className="mobile-card-meta">
                  {isBirthday(p.birthDate) ? '🎂 ¡Cumple hoy!' : p.birthDate ? `🎂 ${new Date(p.birthDate).toLocaleDateString('es-AR')}` : `📅 ${new Date(p.createdAt).toLocaleDateString('es-AR')}`}
                </span>
                <div className="mobile-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} aria-label={`Editar ${p.firstName}`}>
                    ✏️
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p)} aria-label={`Eliminar ${p.firstName}`} style={{ color: 'var(--accent-danger)' }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Jugador' : 'Nuevo Jugador'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="player-first" className="form-label">Nombre *</label>
                <input
                  id="player-first"
                  className="form-input"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Ej: Juan"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="player-last" className="form-label">Apellido *</label>
                <input
                  id="player-last"
                  className="form-input"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Ej: Pérez"
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="player-nick" className="form-label">Apodo (opcional)</label>
                <input
                  id="player-nick"
                  className="form-input"
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="Ej: Juancito"
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="player-birth" className="form-label">Fecha de nacimiento (opcional)</label>
                <input
                  id="player-birth"
                  className="form-input"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Guardar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
