import { useState, useEffect, useCallback, useRef } from 'react';
import monitorService from '../services/monitorService';
import { useNotification } from './useNotification';

export const useMonitoring = (initialSpeed = 2500) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(initialSpeed);
  const { showNotification } = useNotification();
  const intervalRef = useRef(null);

  // Fetch initial request stack
  const fetchInitialHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await monitorService.getHistory();
      if (response.success && response.data) {
        setRequests(response.data);
      }
    } catch (err) {
      showNotification('Failed to fetch request stream data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Fetch one new live request and append
  const fetchLiveRequest = useCallback(async () => {
    try {
      const response = await monitorService.getLiveRequests();
      if (response.success && response.data) {
        const newReq = response.data;
        
        setRequests((prev) => {
          // Keep max 60 requests in active stream to preserve performance
          const nextList = [newReq, ...prev];
          if (nextList.length > 60) nextList.pop();
          return nextList;
        });

        if (newReq.decision === 'Blocked') {
          showNotification(`Threat Blocked: ${newReq.payload.substring(0, 30)}...`, 'warning');
        }
      }
    } catch (err) {
      // Ignore background stream polling errors silently to not disrupt workspace experience
    }
  }, [showNotification]);

  // Load history on mount
  useEffect(() => {
    fetchInitialHistory();
  }, [fetchInitialHistory]);

  // Polling scheduler
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        fetchLiveRequest();
      }, speed);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, fetchLiveRequest]);

  return {
    requests,
    loading,
    isPlaying,
    speed,
    setIsPlaying,
    setSpeed,
    setRequests,
    refreshHistory: fetchInitialHistory,
    fetchLiveRequest
  };
};

export default useMonitoring;
