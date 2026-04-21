const { shuffleArray } = require('../utils/shuffleArray');

class FixtureService {
  /**
   * Generate Round Robin fixture using the circle method.
   * @param {string[]} teamIds - Array of team UUIDs
   * @param {boolean} returnLeg - If true, generates home & away (ida y vuelta)
   * @returns {Array<{round, matchOrder, homeTeamId, awayTeamId, isBye}>}
   */
  generateRoundRobin(teamIds, returnLeg = false) {
    const teams = [...teamIds];
    shuffleArray(teams);

    // If odd number, add BYE
    if (teams.length % 2 !== 0) {
      teams.push(null); // null = BYE
    }

    const n = teams.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;
    const fixtures = [];

    // The first team stays fixed, rest rotate
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let round = 0; round < rounds; round++) {
      const currentOrder = [fixed, ...rotating];

      for (let match = 0; match < matchesPerRound; match++) {
        const home = currentOrder[match];
        const away = currentOrder[n - 1 - match];
        const isBye = home === null || away === null;

        // Alternate home/away for fairness
        if (round % 2 === 0) {
          fixtures.push({
            round: round + 1,
            matchOrder: match + 1,
            homeTeamId: home,
            awayTeamId: away,
            isBye,
          });
        } else {
          fixtures.push({
            round: round + 1,
            matchOrder: match + 1,
            homeTeamId: away,
            awayTeamId: home,
            isBye,
          });
        }
      }

      // Rotate: last element goes to first position
      rotating.unshift(rotating.pop());
    }

    // If return leg, mirror all fixtures with inverted home/away
    if (returnLeg) {
      const returnFixtures = fixtures
        .filter(f => !f.isBye)
        .map((f, idx) => ({
          round: f.round + rounds,
          matchOrder: f.matchOrder,
          homeTeamId: f.awayTeamId,
          awayTeamId: f.homeTeamId,
          isBye: false,
        }));

      // Also add BYE matches for return leg
      const byeFixtures = fixtures
        .filter(f => f.isBye)
        .map(f => ({
          round: f.round + rounds,
          matchOrder: f.matchOrder,
          homeTeamId: f.awayTeamId,
          awayTeamId: f.homeTeamId,
          isBye: true,
        }));

      return [...fixtures, ...returnFixtures, ...byeFixtures];
    }

    return fixtures;
  }

  /**
   * Generate Single Elimination bracket.
   * Rounds up to next power of 2, adds BYEs for missing slots.
   * @param {string[]} teamIds - Array of team UUIDs
   * @returns {Array<{bracketRound, bracketPosition, homeTeamId, awayTeamId, isBye, status}>}
   */
  generateSingleElimination(teamIds) {
    const teams = [...teamIds];
    shuffleArray(teams);

    // Next power of 2
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const totalRounds = Math.log2(bracketSize);

    // Fill with nulls (BYE)
    while (teams.length < bracketSize) {
      teams.push(null);
    }

    // Seed placement: distribute BYEs so top seeds get them
    const seeded = this._distributeByes(teams);

    const matches = [];
    const matchesInFirstRound = bracketSize / 2;

    // First round
    for (let i = 0; i < matchesInFirstRound; i++) {
      const home = seeded[i * 2];
      const away = seeded[i * 2 + 1];
      const isBye = home === null || away === null;

      matches.push({
        round: 1,
        matchOrder: i + 1,
        bracketRound: 1,
        bracketPosition: i + 1,
        homeTeamId: home,
        awayTeamId: away,
        isBye,
        status: isBye ? 'BYE' : 'PENDING',
      });
    }

    // Subsequent rounds (empty matches to be filled as teams advance)
    let matchesInRound = matchesInFirstRound / 2;
    for (let round = 2; round <= totalRounds; round++) {
      for (let pos = 1; pos <= matchesInRound; pos++) {
        matches.push({
          round,
          matchOrder: pos,
          bracketRound: round,
          bracketPosition: pos,
          homeTeamId: null,
          awayTeamId: null,
          isBye: false,
          status: 'PENDING',
        });
      }
      matchesInRound /= 2;
    }

    return matches;
  }

  /**
   * Distribute BYEs across the bracket so real teams don't face each other
   * when they should get BYEs.
   */
  _distributeByes(teams) {
    const n = teams.length;
    if (n <= 2) return teams;

    // Place real teams first, BYEs spread across the bracket
    const realTeams = teams.filter(t => t !== null);
    const byeCount = teams.length - realTeams.length;

    if (byeCount === 0) return teams;

    // Create bracket with standard seeding
    const result = new Array(n).fill(null);

    // Place teams in standard tournament seeding positions
    // This ensures higher seeds get BYEs
    for (let i = 0; i < realTeams.length; i++) {
      result[i] = realTeams[i];
    }

    // Rearrange so BYEs are spread: pair(0, n-1), pair(1, n-2), etc.
    const paired = [];
    for (let i = 0; i < n / 2; i++) {
      paired.push(result[i]);
      paired.push(result[n - 1 - i]);
    }

    return paired;
  }

  /**
   * Get round name for elimination tournament.
   */
  getRoundName(bracketRound, totalRounds) {
    const roundsFromEnd = totalRounds - bracketRound;
    switch (roundsFromEnd) {
      case 0: return 'Final';
      case 1: return 'Semifinal';
      case 2: return 'Cuartos de Final';
      case 3: return 'Octavos de Final';
      default: return `Ronda ${bracketRound}`;
    }
  }
}

module.exports = new FixtureService();
