/**
 * StandingsTable — Responsive tournament standings table.
 *
 * Mobile: ultra-compact, ALL columns fit screen (no scroll).
 * Desktop: full comfortable table.
 *
 * @param {Array} standings          — array of standing objects from API
 * @param {string} [highlightTeamId] — teamId to highlight as "our team"
 * @param {boolean} [compact=false]  — show fewer columns
 * @param {string} [className]       — extra CSS class
 */
import './StandingsTable.css';

export default function StandingsTable({ standings = [], highlightTeamId, compact = false, className = '' }) {
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
    <div className={`standings-wrapper ${className}`} role="region" aria-label="Tabla de posiciones">
      <table className="standings-table">
        <thead>
          <tr>
            <th className="col-pos">#</th>
            <th className="col-team">Equipo</th>
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
                <td className="col-pos">
                  <span className="position-badge" aria-hidden="true">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : s.position}
                  </span>
                </td>
                <td className="col-team">
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
