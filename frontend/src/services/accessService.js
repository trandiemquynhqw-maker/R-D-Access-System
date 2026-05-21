import api from './api';

export const accessService = {
  checkIn: async (deviceIds, entryPhoto, forceCloseOld = false) => {
    const response = await api.post('/access/check-in', { 
      device_ids: deviceIds,
      entry_photo: entryPhoto,
      force_close_old: forceCloseOld
    });
    return response.data;
  },

  checkOut: async (exitPhoto) => {
    const response = await api.post('/access/check-out', { exit_photo: exitPhoto });
    return response.data;
  },

  getCurrentStatus: async () => {
    const response = await api.get('/access/status');
    return response.data;
  },

  getAccessHistory: async (options = {}) => {
    const response = await api.get('/access/history', { params: options });
    return response.data;
  },

  // Dashboard endpoints
  getRecentActivity: async (limit = 50) => {
    const response = await api.get('/access/dashboard/activity', { params: { limit } });
    return response.data;
  },

  getCurrentOccupancy: async () => {
    const response = await api.get('/access/dashboard/occupancy');
    return response.data;
  },

  getPersonalStats: async () => {
    const response = await api.get('/access/personal-stats');
    return response.data;
  },

  // Admin Session Management
  getAdminSessions: async (status) => {
    const response = await api.get('/access/admin/sessions', { params: { status } });
    return response.data;
  },

  forceCloseSession: async (sessionId, notes) => {
    const response = await api.post(`/access/admin/sessions/${sessionId}/force-close`, { notes });
    return response.data;
  },

  getAuditorSessions: async (filters = {}) => {
    const response = await api.get('/access/auditor/sessions', { params: filters });
    return response.data;
  }
};
