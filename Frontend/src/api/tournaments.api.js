import client from './client';

export const getTournaments = (params) => client.get('/tournaments', { params });
export const getTournament = (id) => client.get(`/tournaments/${id}`);
export const createTournament = (data) => client.post('/tournaments', data);
export const updateTournament = (id, data) => client.put(`/tournaments/${id}`, data);
export const deleteTournament = (id) => client.delete(`/tournaments/${id}`);
export const enrollTeams = (id, teamIds) => client.post(`/tournaments/${id}/enroll`, { teamIds });
export const unenrollTeam = (id, teamId) => client.delete(`/tournaments/${id}/enroll/${teamId}`);
export const generateFixture = (id) => client.post(`/tournaments/${id}/generate-fixture`);
export const confirmFixture = (id) => client.post(`/tournaments/${id}/confirm-fixture`);
export const getStandings = (id) => client.get(`/tournaments/${id}/standings`);
export const getTournamentsByTeam = (teamId) => client.get(`/tournaments/team/${teamId}`);

// Game Types
export const getGameTypes = () => client.get('/game-types');
export const getGameType = (id) => client.get(`/game-types/${id}`);
export const createGameType = (data) => client.post('/game-types', data);
export const updateGameType = (id, data) => client.put(`/game-types/${id}`, data);
export const deleteGameType = (id) => client.delete(`/game-types/${id}`);
