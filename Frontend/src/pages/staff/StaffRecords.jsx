import { useEffect, useState } from 'react';
import { getMyRecords, deleteMyRecord } from '../../api/staff.api';
import { useAuth } from '../../context/AuthContext';
import StaffEmptyState from '../../components/staff/StaffEmptyState';
import StaffErrorState from '../../components/staff/StaffErrorState';
import StaffLoadingState from '../../components/staff/StaffLoadingState';
import StaffRecordCard from '../../components/staff/StaffRecordCard';
import PaginationControls from '../../components/PaginationControls';
import { RECORD_STATUSES, isOwnEditableRecord } from './staffFormatters';
import './StaffPages.css';

const filters = ['ALL', ...RECORD_STATUSES];

const filterLabels = {
  ALL: 'Todos',
  PENDING_REVIEW: 'Pendientes',
  PUBLISHED: 'Publicados',
  REJECTED: 'Rechazados',
  DRAFT: 'Borradores',
  ARCHIVED: 'Archivados',
};
const PAGE_SIZE = 25;

export default function StaffRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const loadRecords = async (pageToLoad = page, filterToLoad = filter) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageToLoad,
        limit: PAGE_SIZE,
        ...(filterToLoad !== 'ALL' ? { status: filterToLoad } : {}),
      };
      const { data } = await getMyRecords(params);
      setRecords(data.items || data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar tus registros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(page, filter);
  }, [page, filter]);

  const handleDelete = async (record) => {
    const confirmed = window.confirm(`Eliminar "${record.title}"?`);
    if (!confirmed) return;

    setSaving(true);
    setFeedback(null);
    try {
      await deleteMyRecord(record.id);
      setFeedback({ type: 'success', message: 'Registro eliminado.' });
      await loadRecords(page, filter);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'No se pudo eliminar el registro.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StaffLoadingState label="Cargando registros..." />;
  if (error) return <StaffErrorState message={error} onRetry={loadRecords} />;

  return (
    <section className="page-container staff-page">
      <div className="staff-hero">
        <div>
          <p className="staff-kicker">Seguimiento</p>
          <h1 className="page-title">Mis registros</h1>
          <p className="staff-page-copy">
            Registros propios y registros accesibles por tus proyectos asignados.
          </p>
        </div>
      </div>

      {feedback && <div className={`staff-feedback ${feedback.type}`}>{feedback.message}</div>}

      <div className="staff-tabs" aria-label="Filtros de estado">
        {filters.map((status) => (
          <button
            key={status}
            type="button"
            className={`staff-tab ${filter === status ? 'active' : ''}`}
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
            disabled={saving}
          >
            {filterLabels[status] || status}
          </button>
        ))}
      </div>

      {records.length ? (
        <div className="staff-list">
          {records.map((record) => {
            const canEdit = isOwnEditableRecord(record, user);
            return (
              <StaffRecordCard
                key={record.id}
                record={record}
                canEdit={canEdit}
                canDelete={canEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      ) : (
        <StaffEmptyState
          title="No hay registros para mostrar"
          message={filter === 'ALL' ? 'Cuando cargues registros van a aparecer aca.' : 'No hay registros con ese estado.'}
        />
      )}
      <PaginationControls pagination={pagination} onPageChange={setPage} disabled={saving} />
    </section>
  );
}
