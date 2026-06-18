export default function PaginationControls({ pagination, onPageChange, disabled = false }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <nav className="pagination-controls" aria-label="Paginacion">
      <span className="pagination-summary">
        Pagina {page} de {totalPages} - {total} total
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          Anterior
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
