import apiClient from './api';

export const payloadService = {
  generatePayload: async (payload_type, difficulty, mutation_level) => {
    const response = await apiClient.post('/payload/generate', {
      payload_type,
      difficulty,
      mutation_level
    });
    return response.data;
  },

  getPayloadHistory: async () => {
    const response = await apiClient.get('/payload/history');
    return response.data;
  }
};

export default payloadService;
