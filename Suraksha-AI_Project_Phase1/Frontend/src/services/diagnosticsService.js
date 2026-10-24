import apiClient from './api';

export const fetchDiagnostics = async () => {
  const response = await apiClient.get('/detection/health');
  return response.data;
};

export const triggerRetraining = async () => {
  const response = await apiClient.post('/detection/train');
  return response.data;
};
