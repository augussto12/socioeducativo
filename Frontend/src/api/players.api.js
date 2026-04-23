import client from './client';

export const getPlayersByTeam = (teamId) => client.get(`/teams/${teamId}/players`);
export const createPlayer = (teamId, data) => client.post(`/teams/${teamId}/players`, data);
export const updatePlayer = (teamId, playerId, data) => client.put(`/teams/${teamId}/players/${playerId}`, data);
export const deletePlayer = (teamId, playerId) => client.delete(`/teams/${teamId}/players/${playerId}`);
export const getBirthdaysToday = () => client.get('/players/birthdays');
