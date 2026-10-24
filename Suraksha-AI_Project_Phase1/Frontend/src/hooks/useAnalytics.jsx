import { useState, useEffect, useCallback } from 'react';
import analyticsService from '../services/analyticsService';
import { useNotification } from './useNotification';

export const useAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getThreatAnalytics();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error("Failed to fetch analytics.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to retrieve analytics databases";
      setError(errMsg);
      showNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refresh: fetchAnalytics
  };
};

export default useAnalytics;
