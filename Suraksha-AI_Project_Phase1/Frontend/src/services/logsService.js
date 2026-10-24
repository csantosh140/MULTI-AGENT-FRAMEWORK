import apiClient from './api';

export const logsService = {
  getLogs: async (params = {}) => {
    const response = await apiClient.get('/logs', { params });
    return response.data;
  },

  getLog: async (id) => {
    const response = await apiClient.get(`/logs/${id}`);
    return response.data;
  },

  deleteLog: async (id) => {
    const response = await apiClient.delete(`/logs/${id}`);
    return response.data;
  }
};

export default logsService;
