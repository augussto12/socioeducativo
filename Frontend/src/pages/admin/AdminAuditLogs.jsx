import { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/admin.api';
import AdminLoadingState from '../../components/admin/AdminLoadingState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import AdminTable from '../../components/admin/AdminTable';
import PaginationControls from '../../components/PaginationControls';
import '../../components/admin/AdminComponents.css';

const PAGE_SIZE = 50;

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

function summarizeMetadata(metadata) {
  if (!metadata) return 'Sin metadata';
  const text = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      setLoading(true);
      setError('');
      try {
        const { data } = await getAuditLogs({ page, limit: PAGE_SIZE });
        if (!active) return;
        setLogs(data.items || []);
        setPagination(data.pagination || null);
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'No se pudo cargar la auditoria.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLogs();
    return () => {
      active = false;
    };
  }, [page]);

  if (loading) return <AdminLoadingState label="Cargando auditoria..." />;
  if (error) return <AdminErrorState message={error} />;

  const columns = [
    { key: 'createdAt', label: 'Fecha', render: (log) => formatDate(log.createdAt) },
    { key: 'user', label: 'Usuario', render: (log) => log.user?.name || log.user?.email || 'Sistema' },
    { key: 'action', label: 'Accion', render: (log) => <strong>{log.action}</strong> },
    { key: 'entityType', label: 'Entidad' },
    { key: 'entityId', label: 'Entity ID', render: (log) => <code>{log.entityId || 'N/A'}</code> },
    { key: 'metadata', label: 'Metadata', render: (log) => <code>{summarizeMetadata(log.metadata)}</code> },
  ];

  return (
    <section className="page-container admin-panel">
      <div className="admin-toolbar">
        <div>
          <h1 className="page-title">Auditoria</h1>
          <p className="admin-muted">Ultimas acciones registradas en el sistema.</p>
        </div>
        {pagination && <span className="admin-muted">Total: {pagination.total}</span>}
      </div>

      <AdminTable
        columns={columns}
        rows={logs}
        getRowKey={(log) => log.id}
        emptyTitle="Sin auditoria"
        emptyMessage="Todavia no hay acciones registradas."
      />
      <PaginationControls pagination={pagination} onPageChange={setPage} />
    </section>
  );
}
