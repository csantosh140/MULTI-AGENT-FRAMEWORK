import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import { useNotification } from './useNotification';

export const useDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getStats();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error("Failed to resolve stats.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to fetch dashboard metrics";
      setError(errMsg);
      showNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refresh: fetchStats
  };
};

export default useDashboard;
