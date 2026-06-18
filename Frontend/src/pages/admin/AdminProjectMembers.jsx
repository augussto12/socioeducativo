import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addAdminProjectMember, getAdminProject, removeAdminProjectMember } from '../../api/projects.api';
import { getAdminUsers } from '../../api/users.api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import AdminFormField from '../../components/admin/AdminFormField';
import AdminLoadingState from '../../components/admin/AdminLoadingState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminTable from '../../components/admin/AdminTable';
import '../../components/admin/AdminComponents.css';

export default function AdminProjectMembers() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: '', roleInProject: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectResponse, usersResponse] = await Promise.all([getAdminProject(id), getAdminUsers()]);
      setProject(projectResponse.data);
      setUsers(usersResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los miembros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const assignedIds = useMemo(() => new Set(project?.members?.map((member) => member.userId) || []), [project]);
  const availableStaff = users.filter((user) => user.role === 'STAFF' && user.isActive && !assignedIds.has(user.id));
  const userOptions = [
    { value: '', label: availableStaff.length ? 'Seleccionar usuario STAFF' : 'No hay STAFF disponible' },
    ...availableStaff.map((user) => ({ value: user.id, label: `${user.name} - ${user.email}` })),
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.userId) {
      setFeedback({ type: 'error', message: 'Selecciona un usuario STAFF.' });
      return;
    }

    setSaving(true);
    try {
      await addAdminProjectMember(id, form);
      setForm({ userId: '', roleInProject: '' });
      setFeedback({ type: 'success', message: 'Miembro asignado correctamente.' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo asignar el miembro.' });
    } finally {
      setSaving(false);
    }
  };

  const askRemove = (member) => {
    setConfirm({
      member,
      title: 'Quitar miembro',
      message: `Se quitara a ${member.user?.name || member.user?.email} del proyecto.`,
    });
  };

  const confirmRemove = async () => {
    if (!confirm?.member) return;
    setSaving(true);
    try {
      await removeAdminProjectMember(id, confirm.member.userId);
      setConfirm(null);
      setFeedback({ type: 'success', message: 'Miembro removido.' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo quitar el miembro.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState label="Cargando miembros..." />;
  if (error) return <AdminErrorState message={error} />;

  const columns = [
    { key: 'user', label: 'Usuario', render: (member) => (
      <div>
        <strong>{member.user?.name || 'Sin nombre'}</strong>
        <p className="admin-muted">{member.user?.email}</p>
      </div>
    ) },
    { key: 'role', label: 'Rol en proyecto', render: (member) => member.roleInProject || 'Sin rol especifico' },
    { key: 'active', label: 'Estado', render: (member) => <AdminStatusBadge value={member.user?.isActive} label={member.user?.isActive ? 'Activo' : 'Inactivo'} /> },
    { key: 'actions', label: 'Acciones', render: (member) => (
      <button type="button" className="btn btn-danger btn-sm" onClick={() => askRemove(member)}>Quitar</button>
    ) },
  ];

  return (
    <section className="page-container admin-panel">
      <div className="admin-toolbar">
        <div>
          <Link className="btn btn-ghost btn-sm" to="/admin/proyectos">Volver a proyectos</Link>
          <h1 className="page-title" style={{ marginTop: 'var(--space-md)' }}>Miembros del proyecto</h1>
          <p className="admin-muted">{project?.name}</p>
        </div>
      </div>

      {feedback && <div className={`admin-feedback ${feedback.type}`}>{feedback.message}</div>}

      <form className="admin-card admin-form" onSubmit={handleSubmit}>
        <h2>Asignar STAFF</h2>
        <div className="admin-form-grid">
          <AdminFormField label="Usuario" name="userId" as="select" value={form.userId} onChange={handleChange} options={userOptions} required />
          <AdminFormField label="Rol en proyecto" name="roleInProject" value={form.roleInProject} onChange={handleChange} placeholder="Docente, coordinacion, tallerista..." />
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" type="submit" disabled={saving || !availableStaff.length}>
            {saving ? 'Asignando...' : 'Asignar miembro'}
          </button>
        </div>
      </form>

      <AdminTable
        columns={columns}
        rows={project?.members || []}
        getRowKey={(member) => member.id}
        emptyTitle="Sin miembros"
        emptyMessage="Este proyecto todavia no tiene usuarios asignados."
      />

      <AdminConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Quitar"
        onConfirm={confirmRemove}
        onCancel={() => setConfirm(null)}
        loading={saving}
      />
    </section>
  );
}
