import apiClient from './api';

export const monitorService = {
  getLiveRequests: async () => {
    const response = await apiClient.get('/requests/live');
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get('/requests/history');
    return response.data;
  }
};

export default monitorService;
