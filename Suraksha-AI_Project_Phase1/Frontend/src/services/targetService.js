import apiClient from './api';

export const sendTargetLogin = async (username, password) => {
  try {
    const response = await apiClient.post('/target/login', { username, password });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const sendTargetSearch = async (query, category = 'all') => {
  try {
    const response = await apiClient.post('/target/search', { query, category });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};
