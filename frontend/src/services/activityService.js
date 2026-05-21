import api from './api';

export const activityService = {
  getRecentActivity: async (limit = 50) => {
    const response = await api.get(`/activity?limit=${limit}`);
    return response.data;
  },

  getMyActivity: async (limit = 50) => {
    const response = await api.get(`/activity/me?limit=${limit}`);
    return response.data;
  },
  
  getSystemHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  getAuditLogs: async (filters = {}) => {
    const response = await api.get('/activity/audit-logs', { params: filters });
    return response.data;
  }
};
