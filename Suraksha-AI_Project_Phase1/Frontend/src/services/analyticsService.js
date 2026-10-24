import apiClient from './api';

export const analyticsService = {
  getThreatAnalytics: async () => {
    const response = await apiClient.get('/analytics/overview');
    const data = response.data.data;

    // Transform backend keys to match ThreatAnalytics.jsx expectations
    const mappedData = {
      metrics: {
        mostTargetedEndpoint: data.topEndpoint || "None",
        averageResponseTime: data.averageResponseTime || "0.0 ms",
        mostCommonPayload: data.mostCommonPayload || "None",
        topAttackingIp: data.topAttackingIp || "None"
      },
      threatDistribution: data.threatDistribution || [],
      weeklyTrend: data.weeklyTrend || [],
      monthlyTrend: data.monthlyTrend || []
    };

    return {
      success: true,
      data: mappedData
    };
  }
};

export default analyticsService;
