import { useState, useEffect, useCallback } from 'react';
import logsService from '../services/logsService';
import { useNotification } from './useNotification';

export const useLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchLogs = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await logsService.getLogs(filters);
      if (response.success) {
        setLogs(response.data);
      } else {
        throw new Error("Failed to load logs database.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to retrieve logs database";
      setError(errMsg);
      showNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const deleteLog = useCallback(async (id) => {
    try {
      const response = await logsService.deleteLog(id);
      if (response.success) {
        setLogs((prev) => prev.filter((log) => log.id !== id));
        showNotification("Threat incident log archived successfully.", "warning");
        return true;
      }
      throw new Error(response.message || "Deletion failed.");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to delete threat incident.";
      showNotification(errMsg, 'error');
      return false;
    }
  }, [showNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs,
    deleteLog
  };
};

export default useLogs;
