import { useEffect, useMemo, useState } from 'react';
import { getSiteContent, updateAdminSiteContent } from '../../api/siteContent.api';
import AdminFormField from '../../components/admin/AdminFormField';
import AdminLoadingState from '../../components/admin/AdminLoadingState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import '../../components/admin/AdminComponents.css';

const preferredOrder = ['home', 'quienes-somos', 'objetivos', 'normativa'];

function sortContent(items) {
  return [...items].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.key);
    const bIndex = preferredOrder.indexOf(b.key);
    if (aIndex === -1 && bIndex === -1) return a.key.localeCompare(b.key);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export default function AdminSiteContent() {
  const [items, setItems] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      setLoading(true);
      setError('');
      try {
        const { data } = await getSiteContent();
        if (!active) return;
        const sorted = sortContent(data || []);
        setItems(sorted);
        if (sorted[0]) setSelectedKey(sorted[0].key);
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'No se pudo cargar el contenido institucional.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContent();
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(() => items.find((item) => item.key === selectedKey), [items, selectedKey]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      title: selected.title || '',
      content: selected.content || '',
      imageUrl: selected.imageUrl || '',
    });
  }, [selected]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.title.trim() || !form.content.trim()) {
      setFeedback({ type: 'error', message: 'Titulo y contenido son requeridos.' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await updateAdminSiteContent(selectedKey, form);
      setItems((current) => sortContent(current.map((item) => (item.key === selectedKey ? data : item))));
      setFeedback({ type: 'success', message: 'Contenido guardado correctamente.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo guardar el contenido.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState label="Cargando contenido..." />;
  if (error) return <AdminErrorState message={error} />;
  if (!items.length) return <AdminEmptyState title="No hay contenidos" />;

  return (
    <section className="page-container admin-panel">
      <div className="admin-toolbar">
        <div>
          <h1 className="page-title">Contenido institucional</h1>
          <p className="admin-muted">Edita textos publicos del sitio sin tocar codigo.</p>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Secciones de contenido">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`admin-tab ${item.key === selectedKey ? 'active' : ''}`}
            onClick={() => {
              setFeedback(null);
              setSelectedKey(item.key);
            }}
          >
            {item.key}
          </button>
        ))}
      </div>

      <form className="admin-card admin-form" onSubmit={handleSubmit}>
        <AdminFormField label="Titulo" name="title" value={form.title} onChange={handleChange} required />
        <AdminFormField label="Contenido" name="content" as="textarea" value={form.content} onChange={handleChange} required />
        <AdminFormField label="Imagen URL" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." />

        {feedback && <div className={`admin-feedback ${feedback.type}`}>{feedback.message}</div>}

        <div className="admin-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}
