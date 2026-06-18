import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../api/admin.api';
import AdminLoadingState from '../../components/admin/AdminLoadingState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import './AdminDashboard.css';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const { data } = await getAdminDashboard();
        if (active) setDashboard(data);
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'No se pudo cargar el dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <AdminLoadingState label="Cargando dashboard..." />;
  if (error) return <AdminErrorState message={error} />;
  if (!dashboard) return <AdminEmptyState title="Dashboard sin datos" />;

  const metrics = [
    { label: 'Proyectos', value: dashboard.projects },
    { label: 'Proyectos publicos', value: dashboard.publicProjects },
    { label: 'Registros', value: dashboard.records },
    { label: 'Pendientes', value: dashboard.recordsPendingReview },
    { label: 'Usuarios STAFF', value: dashboard.staffUsers },
  ];

  return (
    <section className="page-container admin-panel">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel administrador</h1>
          <p className="admin-muted">Resumen operativo del sistema socioeducativo.</p>
        </div>
      </div>

      <div className="admin-metrics-grid">
        {metrics.map((metric) => (
          <article className="admin-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value ?? 0}</strong>
          </article>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <article className="admin-card">
          <h2>Ultimos registros</h2>
          {dashboard.latestRecords?.length ? (
            <div className="admin-dashboard-list">
              {dashboard.latestRecords.map((record) => (
                <div className="admin-dashboard-item" key={record.id}>
                  <div>
                    <strong>{record.title}</strong>
                    <p>{record.project?.name || 'Sin proyecto'} - {record.author?.name || record.author?.email || 'Sin autor'}</p>
                  </div>
                  <AdminStatusBadge value={record.status} />
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="Sin registros" message="Todavia no hay registros cargados." />
          )}
        </article>

        <article className="admin-card">
          <h2>Ultima actividad</h2>
          {dashboard.latestAuditLogs?.length ? (
            <div className="admin-dashboard-list">
              {dashboard.latestAuditLogs.map((log) => (
                <div className="admin-dashboard-item" key={log.id}>
                  <div>
                    <strong>{log.action}</strong>
                    <p>{log.user?.name || log.user?.email || 'Sistema'} - {log.entityType}</p>
                  </div>
                  <span className="admin-dashboard-date">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="Sin auditoria" message="Todavia no hay actividad registrada." />
          )}
        </article>
      </div>
    </section>
  );
}
