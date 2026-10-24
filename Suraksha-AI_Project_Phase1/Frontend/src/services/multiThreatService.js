import apiClient from './api';

/**
 * Multi-Threat Detection API service.
 * Talks to the new /api/detection/multi-threat* endpoints on the Suraksha-AI backend.
 */

/**
 * Scan a full HTTP request context for multi-threat attack vectors.
 * @param {Object} requestData - { url, method, headers, cookies, parameters, body }
 */
export const scanMultiThreat = async (requestData) => {
  const res = await apiClient.post('/detection/multi-threat', requestData);
  return res.data;
};

/**
 * Scan a single raw string payload for multi-threat attack signatures.
 * @param {string} payload - The raw string to analyze
 */
export const scanSinglePayload = async (payload) => {
  const res = await apiClient.post('/detection/multi-threat/scan-payload', { payload });
  return res.data;
};

/**
 * Retrieve metadata about all supported attack categories.
 */
export const getThreatCategories = async () => {
  const res = await apiClient.get('/detection/multi-threat/categories');
  return res.data;
};
