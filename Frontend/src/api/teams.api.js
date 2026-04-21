import client from './client';

export const getTeams = (params) => client.get('/teams', { params });
export const getTeam = (id) => client.get(`/teams/${id}`);
export const createTeam = (data) => client.post('/teams', data);
export const updateTeam = (id, data) => client.put(`/teams/${id}`, data);
export const updateTeamProfile = (id, data) => {
  if (data instanceof FormData) {
    return client.patch(`/teams/${id}/profile`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return client.patch(`/teams/${id}/profile`, data);
};
export const deleteTeam = (id) => client.delete(`/teams/${id}`);
export const resetTeamPassword = (id) => client.post(`/teams/${id}/reset-password`);
export const toggleTeamActive = (id) => client.patch(`/teams/${id}/toggle-active`);

// Players
export const getPlayers = (teamId) => client.get(`/teams/${teamId}/players`);
export const createPlayer = (teamId, data) => client.post(`/teams/${teamId}/players`, data);
export const updatePlayer = (teamId, id, data) => client.put(`/teams/${teamId}/players/${id}`, data);
export const deletePlayer = (teamId, id) => client.delete(`/teams/${teamId}/players/${id}`);
