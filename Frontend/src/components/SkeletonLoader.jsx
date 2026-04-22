/**
 * SkeletonLoader — Shimmer loading placeholder to prevent CLS.
 *
 * @param {'card'|'table-row'|'text'|'avatar'|'stat'|'full-page'} variant
 * @param {number} [count=1]  — number of skeleton items to render
 * @param {string} [width]    — custom width override
 * @param {string} [height]   — custom height override
 * @param {string} [className] — extra CSS class
 */
import './SkeletonLoader.css';

export default function SkeletonLoader({ variant = 'text', count = 1, width, height, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'full-page') {
    return (
      <div className="skeleton-page" role="status" aria-label="Cargando contenido">
        <div className="skeleton-shimmer skeleton-page-header" />
        <div className="skeleton-page-grid">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton-shimmer skeleton-page-card" />
          ))}
        </div>
        <div className="skeleton-shimmer skeleton-page-block" />
        <span className="sr-only">Cargando...</span>
      </div>
    );
  }

  return (
    <div className={`skeleton-container ${className}`} role="status" aria-label="Cargando">
      {items.map(i => (
        <div
          key={i}
          className={`skeleton-shimmer skeleton-${variant}`}
          style={{ width: width || undefined, height: height || undefined }}
        />
      ))}
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
