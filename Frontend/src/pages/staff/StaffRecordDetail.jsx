import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteMyRecord, getMyRecord, updateMyRecord } from '../../api/staff.api';
import { useAuth } from '../../context/AuthContext';
import StaffEmptyState from '../../components/staff/StaffEmptyState';
import StaffErrorState from '../../components/staff/StaffErrorState';
import StaffFileList from '../../components/staff/StaffFileList';
import StaffFileUploader from '../../components/staff/StaffFileUploader';
import StaffLoadingState from '../../components/staff/StaffLoadingState';
import StaffStatusBadge, { TYPE_LABELS } from '../../components/staff/StaffStatusBadge';
import { RECORD_TYPES, dateInputValue, formatDate, isOwnEditableRecord } from './staffFormatters';
import './StaffPages.css';

function recordToForm(record) {
  return {
    title: record?.title || '',
    description: record?.description || '',
    recordDate: dateInputValue(record?.recordDate),
    type: record?.type || 'ACTIVITY',
  };
}

export default function StaffRecordDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(recordToForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const loadRecord = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMyRecord(id);
      setRecord(data);
      setForm(recordToForm(data));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el registro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const canEdit = isOwnEditableRecord(record, user);
  const canUpload = canEdit || isAdmin;
  const canDelete = canEdit;
  const canDeleteFile = (file) => isAdmin || file.uploadedBy === user?.id;

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setFeedback(null);
    try {
      const { data } = await updateMyRecord(record.id, form);
      setRecord(data);
      setForm(recordToForm(data));
      setFeedback({ type: 'success', message: 'Registro actualizado y enviado a revision.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo actualizar el registro.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    const confirmed = window.confirm(`Eliminar "${record.title}"?`);
    if (!confirmed) return;

    setSaving(true);
    setFeedback(null);
    try {
      await deleteMyRecord(record.id);
      navigate('/staff/registros');
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo eliminar el registro.' });
    } finally {
      setSaving(false);
    }
  };

  const refreshAfterFileChange = async () => {
    try {
      const { data } = await getMyRecord(id);
      setRecord(data);
      setForm(recordToForm(data));
    } catch {
      await loadRecord();
    }
  };

  if (loading) return <StaffLoadingState label="Cargando registro..." />;
  if (error) return <StaffErrorState message={error} onRetry={loadRecord} />;
  if (!record) return <StaffEmptyState title="Registro no encontrado" message="No hay datos para mostrar." />;

  return (
    <section className="page-container staff-page">
      <div className="staff-detail-header">
        <div>
          <p className="staff-kicker">{record.project?.name || 'Sin proyecto'} - {formatDate(record.recordDate)}</p>
          <h1 className="page-title">{record.title}</h1>
          <div className="staff-badge-row">
            <StaffStatusBadge value={record.status} />
            <StaffStatusBadge value={record.visibility} />
            <StaffStatusBadge value={record.type} />
          </div>
        </div>
        <div className="staff-actions">
          {record.status === 'PUBLISHED' && record.visibility === 'PUBLIC' && (
            <Link className="btn btn-primary" to={`/registros/${record.id}`}>
              Vista publica
            </Link>
          )}
          <Link className="btn btn-ghost" to="/staff/registros">
            Volver
          </Link>
        </div>
      </div>

      {feedback && <div className={`staff-feedback ${feedback.type}`}>{feedback.message}</div>}

      {record.status === 'PENDING_REVIEW' && (
        <div className="staff-notice warning">Pendiente de revision por el equipo admin.</div>
      )}
      {record.visibility === 'PRIVATE' && (
        <div className="staff-notice">No visible publicamente.</div>
      )}
      {record.status === 'PUBLISHED' && (
        <div className="staff-notice">El backend bloquea cambios en registros publicados.</div>
      )}
      {record.status === 'REJECTED' && (
        <div className="staff-notice danger">
          <strong>Registro rechazado</strong>
          <p>{record.reviewComment || 'No hay comentario de revision cargado.'}</p>
        </div>
      )}

      <div className="staff-detail-grid">
        <form className="staff-panel staff-form" onSubmit={handleUpdate}>
          <h2>{canEdit ? 'Editar registro' : 'Detalle del registro'}</h2>
          <div className="staff-form-grid">
            <label className="staff-field">
              <span>Titulo</span>
              <input name="title" value={form.title} onChange={handleChange} disabled={!canEdit || saving} required />
            </label>
            <label className="staff-field">
              <span>Fecha</span>
              <input name="recordDate" type="date" value={form.recordDate} onChange={handleChange} disabled={!canEdit || saving} required />
            </label>
            <label className="staff-field">
              <span>Tipo</span>
              <select name="type" value={form.type} onChange={handleChange} disabled={!canEdit || saving}>
                {RECORD_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="staff-panel">
              <h3>Estado actual</h3>
              <p>{TYPE_LABELS[record.type] || record.type} - {record.visibility} - {record.status}</p>
            </div>
          </div>
          <label className="staff-field">
            <span>Descripcion</span>
            <textarea name="description" value={form.description} onChange={handleChange} disabled={!canEdit || saving} />
          </label>
          <div className="staff-form-actions">
            {canEdit && (
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
            {canDelete && (
              <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={saving}>
                Eliminar registro
              </button>
            )}
          </div>
        </form>

        <aside className="staff-panel">
          <h2>Resumen</h2>
          <dl className="staff-detail-list">
            <div>
              <dt>Proyecto</dt>
              <dd>{record.project?.name || 'Sin proyecto'}</dd>
            </div>
            <div>
              <dt>Autor</dt>
              <dd>{record.author?.name || record.author?.email || 'Sin autor'}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{formatDate(record.recordDate)}</dd>
            </div>
            <div>
              <dt>Archivos</dt>
              <dd>{record.files?.length ?? 0}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="staff-detail-grid">
        {canUpload && <StaffFileUploader recordId={record.id} onUploaded={refreshAfterFileChange} />}
        <section className="staff-panel">
          <h2>Archivos asociados</h2>
          <StaffFileList
            files={record.files || []}
            canDeleteFile={canDeleteFile}
            onDeleted={refreshAfterFileChange}
          />
        </section>
      </div>
    </section>
  );
}
