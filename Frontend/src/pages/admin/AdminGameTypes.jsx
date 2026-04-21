import { useState, useEffect } from 'react';
import { getGameTypes, createGameType, updateGameType, deleteGameType } from '../../api/tournaments.api';
import { useToast } from '../../hooks/useToast';
import './AdminCrud.css';

export default function AdminGameTypes() {
  const [gameTypes, setGameTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '🎮', description: '', rulesMd: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      const { data } = await getGameTypes();
      setGameTypes(data);
    } catch { toast.error('Error cargando juegos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', icon: '🎮', description: '', rulesMd: '' });
    setShowModal(true);
  };

  const openEdit = (gt) => {
    setEditing(gt);
    setForm({ name: gt.name, icon: gt.icon, description: gt.description || '', rulesMd: gt.rulesMd || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('El nombre es requerido');
    setSaving(true);
    try {
      if (editing) {
        await updateGameType(editing.id, form);
        toast.success('Juego actualizado');
      } else {
        await createGameType(form);
        toast.success('Juego creado');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (gt) => {
    if (!confirm(`¿Eliminar "${gt.name}"?`)) return;
    try {
      await deleteGameType(gt.id);
      toast.success('Juego eliminado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const commonEmojis = ['🏓', '♟️', '🃏', '⚽', '🎯', '🎱', '🏀', '🎮', '🎲', '🎳', '🏐', '🎸'];

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="admin-crud">
      <toast.ToastContainer />

      <div className="page-header">
        <h1 className="page-title">🎮 Tipos de Juego</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Juego</button>
      </div>

      {gameTypes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎮</div>
          <h3>Sin tipos de juego</h3>
          <p>Creá el primer tipo de juego</p>
        </div>
      ) : (
        <div className="game-type-grid">
          {gameTypes.map((gt, i) => (
            <div key={gt.id} className={`game-type-card animate-slide-up stagger-${(i % 6) + 1}`}>
              <div className="game-type-icon">{gt.icon}</div>
              <div className="game-type-name">{gt.name}</div>
              <div className="game-type-desc">{gt.description || 'Sin descripción'}</div>
              <div className="game-type-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(gt)}>✏️ Editar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(gt)} style={{ color: 'var(--accent-danger)' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Juego' : 'Nuevo Juego'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Ping Pong" required autoFocus />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Ícono</label>
                <div className="chips-container">
                  {commonEmojis.map((emoji) => (
                    <span key={emoji} className={`chip ${form.icon === emoji ? 'selected' : ''}`} onClick={() => setForm({ ...form, icon: emoji })}>
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Descripción</label>
                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción del juego" />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Reglas (Markdown)</label>
                <textarea className="form-textarea" value={form.rulesMd} onChange={(e) => setForm({ ...form, rulesMd: e.target.value })} placeholder="## Reglas&#10;- Regla 1&#10;- Regla 2" rows={4} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : (editing ? 'Guardar' : 'Crear')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
