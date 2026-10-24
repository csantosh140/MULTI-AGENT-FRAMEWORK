import apiClient from './api';

export const fetchAgents = async () => {
  const response = await apiClient.get('/agents');
  return response.data;
};

export const fetchAgentTasks = async () => {
  const response = await apiClient.get('/agents/tasks');
  return response.data;
};

export const restartAgent = async (agentId) => {
  const response = await apiClient.post('/agents/restart', { agent_id: agentId });
  return response.data;
};

export const enableAgent = async (agentId) => {
  const response = await apiClient.post('/agents/enable', { agent_id: agentId });
  return response.data;
};

export const disableAgent = async (agentId) => {
  const response = await apiClient.post('/agents/disable', { agent_id: agentId });
  return response.data;
};
