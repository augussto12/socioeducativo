/**
 * TeamProfile — Edit team shield/description with live preview.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeam, updateTeamProfile } from '../../api/teams.api';
import { useToast } from '../../hooks/useToast';
import SkeletonLoader from '../../components/SkeletonLoader';
import ReactMarkdown from 'react-markdown';
import './TeamProfile.css';

export default function TeamProfile() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ shieldUrl: '', descriptionMd: '' });
  const [error, setError] = useState(null);
  const toast = useToast();

  const loadTeam = useCallback(async () => {
    if (!user?.teamId) return;
    try {
      setError(null);
      const res = await getTeam(user.teamId);
      setTeam(res.data);
      setForm({
        shieldUrl: res.data.shieldUrl || '',
        descriptionMd: res.data.descriptionMd || '',
      });
    } catch {
      setError('Error cargando perfil');
    } finally {
      setLoading(false);
    }
  }, [user?.teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateTeamProfile(user.teamId, form);
      toast.success('¡Perfil actualizado! 🎉');
      loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando');
    } finally {
      setSaving(false);
    }
  }, [user?.teamId, form, loadTeam, toast]);

  const shieldPreview = useMemo(() => {
    if (!form.shieldUrl) return null;
    return form.shieldUrl.startsWith('http') ? form.shieldUrl : `${window.location.origin}${form.shieldUrl}`;
  }, [form.shieldUrl]);

  if (loading) return <SkeletonLoader variant="full-page" />;

  if (error) {
    return (
      <div className="team-error-state">
        <span className="emoji-decorative" aria-hidden="true">😢</span>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadTeam}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <section className="team-profile-page" aria-label="Perfil del equipo">
      <toast.ToastContainer />

      <div className="profile-page-header">
        <h1 className="profile-page-title">
          <span aria-hidden="true">👤</span> Perfil del Equipo
        </h1>
      </div>

      <div className="profile-layout">
        {/* ─── Preview Card ──────────────────────── */}
        <article className="profile-preview-card">
          <div className="profile-preview-shield">
            {shieldPreview ? (
              <img
                src={shieldPreview}
                alt={`Escudo de ${team?.name}`}
                className="profile-shield-img"
                loading="lazy"
                width="120"
                height="120"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="profile-shield-placeholder" aria-hidden="true">
                {team?.name?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="profile-preview-name">{team?.name}</h2>
          {form.descriptionMd && (
            <div className="profile-preview-desc">
              <ReactMarkdown>{form.descriptionMd}</ReactMarkdown>
            </div>
          )}
          <div className="profile-preview-stats">
            <span><strong>{team?.players?.length || 0}</strong> jugadores</span>
          </div>
        </article>

        {/* ─── Edit Form ─────────────────────────── */}
        <div className="profile-form-card">
          <h2 className="profile-form-title">
            <span aria-hidden="true">✏️</span> Editar Perfil
          </h2>

          <div className="form-group">
            <label className="form-label" htmlFor="shield-url">URL del Escudo 🛡️</label>
            <input
              id="shield-url"
              className="form-input"
              value={form.shieldUrl}
              onChange={(e) => setForm({ ...form, shieldUrl: e.target.value })}
              placeholder="https://ejemplo.com/escudo.png"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description-md">Descripción del Equipo 📝</label>
            <textarea
              id="description-md"
              className="form-textarea"
              value={form.descriptionMd}
              onChange={(e) => setForm({ ...form, descriptionMd: e.target.value })}
              rows={6}
              placeholder={'Contá algo de tu equipo...\n\nPueden usar **negrita** y *cursiva*!'}
            />
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>
    </section>
  );
}
