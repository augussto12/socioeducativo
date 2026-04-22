/**
 * FixtureView — Responsive fixture/bracket display.
 *
 * Round Robin: collapsible rounds on mobile, all visible on desktop.
 * Single Elimination: list of rounds on mobile, bracket on desktop.
 *
 * @param {Array} matches         — array of match objects
 * @param {string} [format='ROUND_ROBIN'] — 'ROUND_ROBIN' | 'SINGLE_ELIMINATION'
 * @param {string} [highlightTeamId] — team to highlight
 * @param {string} [className]       — extra CSS class
 */
import './FixtureView.css';

export default function FixtureView({ matches = [], format = 'ROUND_ROBIN', highlightTeamId, className = '' }) {
  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">📋</div>
        <h3>Sin fixture todavía</h3>
        <p>El fixture se generará cuando el torneo comience</p>
      </div>
    );
  }

  /* Group matches by round */
  const matchesByRound = matches.reduce((acc, m) => {
    const round = m.round || m.bracketRound || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(m);
    return acc;
  }, {});

  const roundEntries = Object.entries(matchesByRound);

  /* Find the latest unfinished round for default-open state */
  const activeRound = roundEntries.find(([, roundMatches]) =>
    roundMatches.some(m => m.status !== 'PLAYED')
  )?.[0] || roundEntries[roundEntries.length - 1]?.[0];

  const getRoundLabel = (round, idx) => {
    if (format === 'SINGLE_ELIMINATION') {
      const total = roundEntries.length;
      if (idx === total - 1) return '🏆 Final';
      if (idx === total - 2) return 'Semifinal';
      if (idx === total - 3) return 'Cuartos de Final';
      return `Ronda ${round}`;
    }
    return `Fecha ${round}`;
  };

  const roundStatus = (roundMatches) => {
    const played = roundMatches.filter(m => m.status === 'PLAYED').length;
    const total = roundMatches.filter(m => !m.isBye).length;
    if (played === total && total > 0) return 'completed';
    if (played > 0) return 'in-progress';
    return 'pending';
  };

  return (
    <div className={`fixture-view ${format === 'SINGLE_ELIMINATION' ? 'fixture-elimination' : ''} ${className}`}>
      {roundEntries.map(([round, roundMatches], idx) => {
        const status = roundStatus(roundMatches);
        const isActive = round === activeRound;
        const visibleMatches = roundMatches.filter(m => !m.isBye);

        return (
          <details
            key={round}
            className={`fixture-round-details status-${status}`}
            open={isActive}
          >
            <summary className="fixture-round-summary">
              <span className="fixture-round-label">
                <span className="fixture-round-indicator" aria-hidden="true">
                  {status === 'completed' ? '✅' : status === 'in-progress' ? '🔥' : '⏳'}
                </span>
                {getRoundLabel(round, idx)}
              </span>
              <span className="fixture-round-count">
                {roundMatches.filter(m => m.status === 'PLAYED' && !m.isBye).length}/{visibleMatches.length}
              </span>
            </summary>

            <div className="fixture-round-matches">
              {visibleMatches.map((match) => {
                const isHighlightHome = highlightTeamId && match.homeTeamId === highlightTeamId;
                const isHighlightAway = highlightTeamId && match.awayTeamId === highlightTeamId;

                return (
                  <div
                    key={match.id}
                    className={`fixture-match-card ${match.status === 'PLAYED' ? 'played' : ''} ${match.status === 'POSTPONED' ? 'postponed' : ''}`}
                  >
                    <div className={`fixture-team-name home ${isHighlightHome ? 'highlighted' : ''}`}>
                      {match.homeTeam?.name || 'TBD'}
                    </div>

                    <div className="fixture-score-area">
                      {match.result ? (
                        <span className="fixture-score">
                          {match.result.homeScore}
                          <span className="fixture-score-sep" aria-hidden="true">-</span>
                          {match.result.awayScore}
                        </span>
                      ) : match.status === 'POSTPONED' ? (
                        <span className="fixture-postponed-badge">POST</span>
                      ) : (
                        <span className="fixture-vs" aria-hidden="true">vs</span>
                      )}
                    </div>

                    <div className={`fixture-team-name away ${isHighlightAway ? 'highlighted' : ''}`}>
                      {match.awayTeam?.name || 'TBD'}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
