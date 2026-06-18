import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createAdminProject,
  deleteAdminProject,
  getAdminProjects,
  updateAdminProject,
} from '../../api/projects.api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import AdminFormField from '../../components/admin/AdminFormField';
import AdminLoadingState from '../../components/admin/AdminLoadingState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminTable from '../../components/admin/AdminTable';
import '../../components/admin/AdminComponents.css';

const emptyForm = {
  name: '',
  description: '',
  curricularContents: '',
  methodology: '',
  duration: '',
  pedagogicalFoundation: '',
  status: 'DRAFT',
  visibility: 'PRIVATE',
  coverImageUrl: '',
  displayOrder: 0,
  categoryId: '',
};

const statusOptions = ['DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED'].map((value) => ({ value, label: value }));
const visibilityOptions = ['PRIVATE', 'PUBLIC'].map((value) => ({ value, label: value }));

function toPayload(form) {
  return {
    ...form,
    displayOrder: Number(form.displayOrder || 0),
    categoryId: form.categoryId || null,
    coverImageUrl: form.coverImageUrl || null,
  };
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getAdminProjects();
      setProjects(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los proyectos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = new Map();
    projects.forEach((project) => {
      if (project.category?.id) categories.set(project.category.id, project.category.name);
    });
    return [
      { value: '', label: 'Sin categoria' },
      ...Array.from(categories.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [projects]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = ({ clearFeedback = true } = {}) => {
    setForm(emptyForm);
    setEditingId(null);
    if (clearFeedback) setFeedback(null);
  };

  const editProject = (project) => {
    setEditingId(project.id);
    setForm({
      name: project.name || '',
      description: project.description || '',
      curricularContents: project.curricularContents || '',
      methodology: project.methodology || '',
      duration: project.duration || '',
      pedagogicalFoundation: project.pedagogicalFoundation || '',
      status: project.status || 'DRAFT',
      visibility: project.visibility || 'PRIVATE',
      coverImageUrl: project.coverImageUrl || '',
      displayOrder: project.displayOrder ?? 0,
      categoryId: project.categoryId || '',
    });
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const required = ['name', 'description', 'curricularContents', 'methodology', 'duration', 'pedagogicalFoundation'];
    if (required.some((field) => !String(form[field] || '').trim())) {
      setFeedback({ type: 'error', message: 'Completa todos los campos requeridos.' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateAdminProject(editingId, toPayload(form));
        setFeedback({ type: 'success', message: 'Proyecto actualizado.' });
      } else {
        await createAdminProject(toPayload(form));
        setFeedback({ type: 'success', message: 'Proyecto creado.' });
      }
      await loadProjects();
      if (!editingId) resetForm({ clearFeedback: false });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo guardar el proyecto.' });
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (project) => {
    setConfirm({
      project,
      title: 'Eliminar proyecto',
      message: `El proyecto "${project.name}" se ocultara con soft delete. Esta accion requiere confirmacion.`,
    });
  };

  const confirmDelete = async () => {
    if (!confirm?.project) return;
    setSaving(true);
    try {
      await deleteAdminProject(confirm.project.id);
      setConfirm(null);
      setFeedback({ type: 'success', message: 'Proyecto eliminado.' });
      await loadProjects();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo eliminar el proyecto.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState label="Cargando proyectos..." />;
  if (error) return <AdminErrorState message={error} />;

  const columns = [
    { key: 'name', label: 'Proyecto', render: (project) => (
      <div>
        <strong>{project.name}</strong>
        <p className="admin-muted">{project.slug}</p>
      </div>
    ) },
    { key: 'category', label: 'Categoria', render: (project) => project.category?.name || 'Sin categoria' },
    { key: 'status', label: 'Estado', render: (project) => <AdminStatusBadge value={project.status} /> },
    { key: 'visibility', label: 'Visibilidad', render: (project) => <AdminStatusBadge value={project.visibility} /> },
    { key: 'count', label: 'Registros', render: (project) => project._count?.records ?? 0 },
    { key: 'actions', label: 'Acciones', render: (project) => (
      <div className="admin-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => editProject(project)}>Editar</button>
        <Link className="btn btn-ghost btn-sm" to={`/admin/proyectos/${project.id}/miembros`}>Miembros</Link>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => askDelete(project)}>Eliminar</button>
      </div>
    ) },
  ];

  return (
    <section className="page-container admin-panel">
      <div className="admin-toolbar">
        <div>
          <h1 className="page-title">Proyectos</h1>
          <p className="admin-muted">Gestiona propuestas pedagogicas, estado y visibilidad publica.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => resetForm()}>Nuevo proyecto</button>
      </div>

      {feedback && <div className={`admin-feedback ${feedback.type}`}>{feedback.message}</div>}

      <form className="admin-card admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar proyecto' : 'Crear proyecto'}</h2>
        <div className="admin-form-grid">
          <AdminFormField label="Nombre" name="name" value={form.name} onChange={handleChange} required />
          <AdminFormField label="Duracion" name="duration" value={form.duration} onChange={handleChange} required />
          <AdminFormField label="Estado" name="status" as="select" value={form.status} onChange={handleChange} options={statusOptions} />
          <AdminFormField label="Visibilidad" name="visibility" as="select" value={form.visibility} onChange={handleChange} options={visibilityOptions} />
          <AdminFormField label="Categoria" name="categoryId" as="select" value={form.categoryId} onChange={handleChange} options={categoryOptions} />
          <AdminFormField label="Orden" name="displayOrder" type="number" value={form.displayOrder} onChange={handleChange} min="0" />
        </div>
        <AdminFormField label="Descripcion" name="description" as="textarea" value={form.description} onChange={handleChange} required />
        <AdminFormField label="Contenidos curriculares" name="curricularContents" as="textarea" value={form.curricularContents} onChange={handleChange} required />
        <AdminFormField label="Metodologia" name="methodology" as="textarea" value={form.methodology} onChange={handleChange} required />
        <AdminFormField label="Fundamento pedagogico" name="pedagogicalFoundation" as="textarea" value={form.pedagogicalFoundation} onChange={handleChange} required />
        <AdminFormField label="Portada URL" name="coverImageUrl" value={form.coverImageUrl} onChange={handleChange} placeholder="https://..." />
        <div className="admin-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear proyecto'}</button>
          {editingId && <button className="btn btn-ghost" type="button" onClick={() => resetForm()}>Cancelar edicion</button>}
        </div>
      </form>

      <AdminTable
        columns={columns}
        rows={projects}
        getRowKey={(project) => project.id}
        emptyTitle="No hay proyectos"
        emptyMessage="Crea el primer proyecto pedagogico desde el formulario."
      />

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
