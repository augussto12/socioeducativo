import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminUser,
  deleteAdminUser,
  disableAdminUser,
  enableAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '../../api/users.api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import AdminFormField from '../../components/admin/AdminFormField';
import AdminLoadingState from '../../components/admin/AdminLoadingState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminTable from '../../components/admin/AdminTable';
import PaginationControls from '../../components/PaginationControls';
import '../../components/admin/AdminComponents.css';

const emptyForm = { name: '', email: '', role: 'STAFF', password: '' };
const roleOptions = ['STAFF', 'ADMIN'].map((value) => ({ value, label: value }));
const PAGE_SIZE = 25;

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadUsers = async (pageToLoad = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getAdminUsers({ page: pageToLoad, limit: PAGE_SIZE });
      setUsers(data.items || data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = ({ clearFeedback = true } = {}) => {
    setForm(emptyForm);
    setEditingId(null);
    if (clearFeedback) setFeedback(null);
  };

  const editUser = (user) => {
    setEditingId(user.id);
    setForm({ name: user.name || '', email: user.email || '', role: user.role || 'STAFF', password: '' });
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.name.trim() || !form.email.trim()) {
      setFeedback({ type: 'error', message: 'Nombre y email son requeridos.' });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editingId) {
        await updateAdminUser(editingId, payload);
        setFeedback({ type: 'success', message: 'Usuario actualizado.' });
      } else {
        const { data } = await createAdminUser(payload);
        const passwordInfo = data.initialPassword ? ` Password inicial: ${data.initialPassword}` : '';
        setFeedback({ type: 'success', message: `Usuario creado. Debe cambiar la contrasena al ingresar.${passwordInfo}` });
        resetForm({ clearFeedback: false });
      }
      await loadUsers(page);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo guardar el usuario.' });
    } finally {
      setSaving(false);
    }
  };

  const askAction = (target, action) => {
    const labels = {
      disable: ['Desactivar usuario', `Se desactivara a ${target.email}.`],
      enable: ['Activar usuario', `Se activara a ${target.email}.`],
      delete: ['Eliminar usuario', `Se eliminara a ${target.email} con soft delete.`],
    };
    setConfirm({ target, action, title: labels[action][0], message: labels[action][1] });
  };

  const confirmAction = async () => {
    if (!confirm?.target) return;
    setSaving(true);
    try {
      if (confirm.action === 'disable') await disableAdminUser(confirm.target.id);
      if (confirm.action === 'enable') await enableAdminUser(confirm.target.id);
      if (confirm.action === 'delete') await deleteAdminUser(confirm.target.id);
      setConfirm(null);
      setFeedback({ type: 'success', message: 'Accion aplicada.' });
      await loadUsers(page);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo aplicar la accion.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState label="Cargando usuarios..." />;
  if (error) return <AdminErrorState message={error} />;

  const columns = [
    { key: 'user', label: 'Usuario', render: (user) => (
      <div>
        <strong>{user.name}</strong>
        <p className="admin-muted">{user.email}</p>
      </div>
    ) },
    { key: 'role', label: 'Rol', render: (user) => <AdminStatusBadge value={user.role} /> },
    { key: 'active', label: 'Estado', render: (user) => <AdminStatusBadge value={user.isActive} label={user.isActive ? 'Activo' : 'Inactivo'} /> },
    { key: 'password', label: 'Password', render: (user) => user.mustChangePassword ? 'Debe cambiar' : 'Actualizada' },
    { key: 'actions', label: 'Acciones', render: (user) => (
      <div className="admin-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => editUser(user)}>Editar</button>
        {user.isActive ? (
          <button type="button" className="btn btn-warning btn-sm" onClick={() => askAction(user, 'disable')} disabled={user.id === currentUser?.id}>Desactivar</button>
        ) : (
          <button type="button" className="btn btn-success btn-sm" onClick={() => askAction(user, 'enable')}>Activar</button>
        )}
        <button type="button" className="btn btn-danger btn-sm" onClick={() => askAction(user, 'delete')} disabled={user.id === currentUser?.id}>Eliminar</button>
      </div>
    ) },
  ];

  return (
    <section className="page-container admin-panel">
      <div className="admin-toolbar">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="admin-muted">Administra accesos ADMIN y STAFF.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => resetForm()}>Nuevo usuario</button>
      </div>

      {feedback && <div className={`admin-feedback ${feedback.type}`}>{feedback.message}</div>}

      <form className="admin-card admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar usuario' : 'Crear usuario'}</h2>
        <div className="admin-form-grid">
          <AdminFormField label="Nombre" name="name" value={form.name} onChange={handleChange} required />
          <AdminFormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <AdminFormField label="Rol" name="role" as="select" value={form.role} onChange={handleChange} options={roleOptions} />
          <AdminFormField label={editingId ? 'Nueva password opcional' : 'Password inicial opcional'} name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimo 8 caracteres" />
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar usuario' : 'Crear usuario'}</button>
          {editingId && <button className="btn btn-ghost" type="button" onClick={() => resetForm()}>Cancelar edicion</button>}
        </div>
      </form>

      <AdminTable
        columns={columns}
        rows={users}
        getRowKey={(user) => user.id}
        emptyTitle="No hay usuarios"
        emptyMessage="Crea usuarios ADMIN o STAFF desde el formulario."
      />
      <PaginationControls pagination={pagination} onPageChange={setPage} disabled={saving} />

      <AdminConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Confirmar"
        onConfirm={confirmAction}
        onCancel={() => setConfirm(null)}
        loading={saving}
      />
    </section>
  );
}
