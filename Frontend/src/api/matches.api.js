import client from './client';

export const getMatchesByTournament = (tournamentId, params) =>
  client.get(`/tournaments/${tournamentId}/matches`, { params });
export const getMatch = (id) => client.get(`/matches/${id}`);
export const updateMatch = (id, data) => client.put(`/matches/${id}`, data);
export const changeMatchStatus = (id, status) => client.patch(`/matches/${id}/status`, { status });
export const recordResult = (id, data) => client.post(`/matches/${id}/result`, data);
export const editResult = (id, data) => client.put(`/matches/${id}/result`, data);
export const getMatchesByTeam = (teamId, params) => client.get(`/matches/team/${teamId}`, { params });
export const getNextMatch = (teamId) => client.get(`/matches/team/${teamId}/next`);
export const getRecentResults = (teamId, limit) => client.get(`/matches/team/${teamId}/recent`, { params: { limit } });
