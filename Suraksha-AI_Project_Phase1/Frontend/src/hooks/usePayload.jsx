import { useState, useEffect, useCallback } from 'react';
import payloadService from '../services/payloadService';
import { useNotification } from './useNotification';

export const usePayload = () => {
  const [generatedPayload, setGeneratedPayload] = useState("Select settings and click 'Generate Exploit Payload'");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await payloadService.getPayloadHistory();
      if (result.success) {
        setHistory(result.data);
      } else {
        throw new Error("Failed to fetch payload history.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to retrieve payload history logs";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async (type, difficulty, mutationLevel) => {
    setGenerating(true);
    try {
      const result = await payloadService.generatePayload(type, difficulty, mutationLevel);
      if (result.success && result.data) {
        setGeneratedPayload(result.data.payload);
        showNotification('New SQL Injection payload generated!', 'success');
        // Refresh history log list
        fetchHistory();
        return result.data;
      }
      throw new Error(result.message || "Failed to generate payload.");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Error compiling payload";
      showNotification(errMsg, 'error');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [showNotification, fetchHistory]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    generatedPayload,
    history,
    loading,
    generating,
    error,
    generatePayload: generate,
    refreshHistory: fetchHistory
  };
};

export default usePayload;
