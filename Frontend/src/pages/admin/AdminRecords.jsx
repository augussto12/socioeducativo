import { useEffect, useState } from 'react';
import {
  changeAdminRecordStatus,
  deleteAdminRecord,
  getAdminRecord,
  getAdminRecords,
  updateAdminRecord,
} from '../../api/records.api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import AdminFormField from '../../components/admin/AdminFormField';
import AdminLoadingState from '../../components/admin/AdminLoadingState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminTable from '../../components/admin/AdminTable';
import PaginationControls from '../../components/PaginationControls';
import '../../components/admin/AdminComponents.css';

const statusFilters = ['ALL', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'DRAFT'];
const statusOptions = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'].map((value) => ({ value, label: value }));
const typeOptions = ['ACTIVITY', 'EVIDENCE', 'PLANNING', 'REFLECTION', 'EVALUATION', 'OTHER'].map((value) => ({ value, label: value }));
const visibilityOptions = ['PRIVATE', 'PUBLIC'].map((value) => ({ value, label: value }));
const PAGE_SIZE = 25;

function dateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function recordToForm(record) {
  return {
    title: record.title || '',
    description: record.description || '',
    recordDate: dateInput(record.recordDate),
    type: record.type || 'ACTIVITY',
    visibility: record.visibility || 'PRIVATE',
    status: record.status || 'PENDING_REVIEW',
  };
}

export default function AdminRecords() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(recordToForm({}));
  const [filter, setFilter] = useState('ALL');
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadRecords = async (pageToLoad = page, filterToLoad = filter) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageToLoad,
        limit: PAGE_SIZE,
        ...(filterToLoad !== 'ALL' ? { status: filterToLoad } : {}),
      };
      const { data } = await getAdminRecords(params);
      setRecords(data.items || data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los registros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(page, filter);
  }, [page, filter]);

  const selectRecord = async (record) => {
    setDetailLoading(true);
    setFeedback(null);
    try {
      const { data } = await getAdminRecord(record.id);
      setSelected(data);
      setForm(recordToForm(data));
      setReviewComment(data.reviewComment || '');
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo cargar el detalle.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { data } = await updateAdminRecord(selected.id, form);
      setSelected(data);
      setForm(recordToForm(data));
      setFeedback({ type: 'success', message: 'Registro actualizado.' });
      await loadRecords(page, filter);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo actualizar el registro.' });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status, visibility = form.visibility) => {
    if (!selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { data } = await changeAdminRecordStatus(selected.id, {
        status,
        visibility,
        reviewComment,
      });
      setSelected(data);
      setForm(recordToForm(data));
      setFeedback({ type: 'success', message: `Registro actualizado a ${status}.` });
      await loadRecords(page, filter);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo cambiar el estado.' });
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (record) => {
    setConfirm({
      record,
      title: 'Eliminar registro',
      message: `El registro "${record.title}" se eliminara con soft delete.`,
    });
  };

  const confirmDelete = async () => {
    if (!confirm?.record) return;
    setSaving(true);
    try {
      await deleteAdminRecord(confirm.record.id);
      if (selected?.id === confirm.record.id) setSelected(null);
      setConfirm(null);
      setFeedback({ type: 'success', message: 'Registro eliminado.' });
      await loadRecords(page, filter);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo eliminar el registro.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState label="Cargando registros..." />;
  if (error) return <AdminErrorState message={error} />;

  const columns = [
    { key: 'title', label: 'Registro', render: (record) => (
      <div>
        <strong>{record.title}</strong>
        <p className="admin-muted">{record.project?.name || 'Sin proyecto'} - {formatDate(record.recordDate)}</p>
      </div>
    ) },
    { key: 'author', label: 'Autor', render: (record) => record.author?.name || record.author?.email || 'Sin autor' },
    { key: 'status', label: 'Estado', render: (record) => <AdminStatusBadge value={record.status} /> },
    { key: 'visibility', label: 'Visibilidad', render: (record) => <AdminStatusBadge value={record.visibility} /> },
    { key: 'actions', label: 'Acciones', render: (record) => (
      <div className="admin-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => selectRecord(record)}>Ver / editar</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => askDelete(record)}>Eliminar</button>
      </div>
    ) },
  ];

  return (
    <section className="page-container admin-panel">
      <div className="admin-toolbar">
        <div>
          <h1 className="page-title">Registros</h1>
          <p className="admin-muted">Modera, publica, rechaza y archiva registros pedagogicos.</p>
        </div>
      </div>

      {feedback && <div className={`admin-feedback ${feedback.type}`}>{feedback.message}</div>}

      <div className="admin-tabs">
        {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              className={`admin-tab ${filter === status ? 'active' : ''}`}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
        ))}
      </div>

      <AdminTable
        columns={columns}
        rows={records}
        getRowKey={(record) => record.id}
        emptyTitle="Sin registros"
        emptyMessage="No hay registros para el filtro seleccionado."
      />
      <PaginationControls pagination={pagination} onPageChange={setPage} disabled={saving} />

      {detailLoading && <AdminLoadingState label="Cargando detalle..." />}

      {selected && !detailLoading && (
        <form className="admin-card admin-form" onSubmit={handleUpdate}>
          <div className="admin-toolbar">
            <div>
              <h2>Detalle de registro</h2>
              <p className="admin-muted">{selected.project?.name} - {selected.author?.name || selected.author?.email}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Cerrar detalle</button>
          </div>

          <div className="admin-form-grid">
            <AdminFormField label="Titulo" name="title" value={form.title} onChange={handleChange} required />
            <AdminFormField label="Fecha" name="recordDate" type="date" value={form.recordDate} onChange={handleChange} required />
            <AdminFormField label="Tipo" name="type" as="select" value={form.type} onChange={handleChange} options={typeOptions} />
            <AdminFormField label="Visibilidad" name="visibility" as="select" value={form.visibility} onChange={handleChange} options={visibilityOptions} />
            <AdminFormField label="Estado" name="status" as="select" value={form.status} onChange={handleChange} options={statusOptions} />
          </div>
          <AdminFormField label="Descripcion" name="description" as="textarea" value={form.description} onChange={handleChange} />
          <AdminFormField label="Comentario de revision" name="reviewComment" as="textarea" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />

          {selected.files?.length > 0 && (
            <div className="admin-inline-section">
              <h3>Archivos asociados</h3>
              <div className="admin-detail-list">
                {selected.files.map((file) => (
                  <div key={file.id}>
                    <strong>{file.originalName}</strong>
                    <p className="admin-muted">{file.type} - {file.mimeType} - {file.visibility}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="admin-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>Guardar cambios</button>
            <button type="button" className="btn btn-success" disabled={saving} onClick={() => changeStatus('PUBLISHED', 'PUBLIC')}>Publicar</button>
            <button type="button" className="btn btn-warning" disabled={saving} onClick={() => changeStatus('REJECTED', 'PRIVATE')}>Rechazar</button>
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => changeStatus('ARCHIVED', 'PRIVATE')}>Archivar</button>
          </div>
        </form>
      )}

      <AdminConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
        loading={saving}
      />
    </section>
  );
}
