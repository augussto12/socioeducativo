import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createMyProjectRecord, getMyProject } from '../../api/staff.api';
import StaffErrorState from '../../components/staff/StaffErrorState';
import StaffLoadingState from '../../components/staff/StaffLoadingState';
import StaffStatusBadge from '../../components/staff/StaffStatusBadge';
import { RECORD_TYPES, todayInputValue } from './staffFormatters';
import './StaffPages.css';

const initialForm = {
  title: '',
  description: '',
  recordDate: todayInputValue(),
  type: 'ACTIVITY',
};

export default function StaffRecordCreate() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const loadProject = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMyProject(projectId);
      setProject(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo validar el proyecto asignado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.title.trim() || !form.recordDate || !form.type) {
      setFeedback({ type: 'error', message: 'Completa titulo, fecha y tipo.' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await createMyProjectRecord(projectId, {
        title: form.title,
        description: form.description,
        recordDate: form.recordDate,
        type: form.type,
      });
      navigate(`/staff/registros/${data.id}`);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo crear el registro.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StaffLoadingState label="Preparando formulario..." />;
  if (error) return <StaffErrorState message={error} onRetry={loadProject} />;

  return (
    <section className="page-container staff-page">
      <div className="staff-detail-header">
        <div>
          <p className="staff-kicker">{project?.name}</p>
          <h1 className="page-title">Crear registro</h1>
          <p className="staff-page-copy">
            El registro queda privado y pendiente de revision. La publicacion la realiza el equipo admin.
          </p>
          <div className="staff-badge-row">
            <StaffStatusBadge value="PRIVATE" />
            <StaffStatusBadge value="PENDING_REVIEW" />
          </div>
        </div>
        <Link className="btn btn-ghost" to={`/staff/proyectos/${projectId}`}>
          Volver al proyecto
        </Link>
      </div>

      {feedback && <div className={`staff-feedback ${feedback.type}`}>{feedback.message}</div>}

      <form className="staff-panel staff-form" onSubmit={handleSubmit}>
        <div className="staff-form-grid">
          <label className="staff-field">
            <span>Titulo</span>
            <input name="title" value={form.title} onChange={handleChange} required maxLength="200" />
          </label>
          <label className="staff-field">
            <span>Fecha</span>
            <input name="recordDate" type="date" value={form.recordDate} onChange={handleChange} required />
          </label>
          <label className="staff-field">
            <span>Tipo</span>
            <select name="type" value={form.type} onChange={handleChange} required>
              {RECORD_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <div className="staff-notice">
            <strong>Revision requerida</strong>
            <p>No hay acciones de publicar, aprobar o rechazar en el panel STAFF.</p>
          </div>
        </div>

        <label className="staff-field">
          <span>Descripcion</span>
          <textarea name="description" value={form.description} onChange={handleChange} />
        </label>

        <div className="staff-form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Crear registro'}
          </button>
          <Link className="btn btn-ghost" to={`/staff/proyectos/${projectId}`}>
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
