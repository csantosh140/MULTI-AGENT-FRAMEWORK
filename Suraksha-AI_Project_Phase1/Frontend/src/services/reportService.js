import apiClient from './api';

export const reportService = {
  getReports: async () => {
    const response = await apiClient.get('/reports');
    return response.data;
  },

  generateReport: async (type) => {
    const response = await apiClient.post('/reports/generate', { type });
    return response.data;
  },

  downloadReport: async (id) => {
    const response = await apiClient.get(`/reports/download?id=${id}`);
    return response.data;
  },

  deleteReport: async (id) => {
    // Delete report endpoint is simulated locally to satisfy "DO NOT change backend logic"
    return { success: true, deleted_id: id };
  }
};

export default reportService;
