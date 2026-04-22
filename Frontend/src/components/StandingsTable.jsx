/**
 * StandingsTable — Responsive tournament standings table.
 *
 * Mobile: horizontal scroll with sticky first columns + fade hint.
 * Desktop: full table without scroll.
 *
 * @param {Array} standings       — array of standing objects from API
 * @param {string} [highlightTeamId] — teamId to highlight as "our team"
 * @param {boolean} [compact=false]  — show fewer columns
 * @param {string} [className]       — extra CSS class
 */
import { useRef, useEffect, useCallback } from 'react';
import './StandingsTable.css';

export default function StandingsTable({ standings = [], highlightTeamId, compact = false, className = '' }) {
  const wrapperRef = useRef(null);

  const checkScroll = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    el.classList.toggle('scrolled-end', atEnd);
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  if (standings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">📊</div>
        <h3>Sin posiciones todavía</h3>
        <p>Las posiciones aparecerán cuando se jueguen partidos</p>
      </div>
    );
  }

  return (
    <div className={`standings-wrapper ${className}`} ref={wrapperRef} role="region" aria-label="Tabla de posiciones" tabIndex={0}>
      <table className="standings-table">
        <thead>
          <tr>
            <th className="sticky-col col-pos">#</th>
            <th className="sticky-col col-team">Equipo</th>
            <th>PJ</th>
            {!compact && <th>G</th>}
            {!compact && <th>E</th>}
            {!compact && <th>P</th>}
            {!compact && <th>GF</th>}
            {!compact && <th>GC</th>}
            <th>DIF</th>
            <th className="col-pts">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const isUs = highlightTeamId && s.teamId === highlightTeamId;
            return (
              <tr key={s.id || i} className={isUs ? 'standings-highlight' : ''}>
                <td className="sticky-col col-pos">
                  <span className="position-badge" aria-hidden="true">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : s.position}
                  </span>
                </td>
                <td className="sticky-col col-team">
                  <span className={`standings-team-name ${isUs ? 'is-us' : ''}`}>
                    {isUs && <span aria-hidden="true">👉 </span>}
                    {s.team?.name}
                    {isUs && <span className="us-tag"> (Nosotros)</span>}
                  </span>
                </td>
                <td>{s.played}</td>
                {!compact && <td className="td-wins">{s.wins}</td>}
                {!compact && <td>{s.draws}</td>}
                {!compact && <td className="td-losses">{s.losses}</td>}
                {!compact && <td>{s.pointsFor}</td>}
                {!compact && <td>{s.pointsAgainst}</td>}
                <td className={s.pointsDiff > 0 ? 'td-positive' : s.pointsDiff < 0 ? 'td-negative' : ''}>
                  {s.pointsDiff > 0 ? '+' : ''}{s.pointsDiff}
                </td>
                <td className="td-points">{s.totalPoints}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
