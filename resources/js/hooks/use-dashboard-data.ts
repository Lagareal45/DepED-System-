import { useState, useEffect } from 'react';
import { dashboardService, type DashboardMetrics, type MonthlyData, type TrafficSource, type TrafficSourceItem, type ActivityLog } from '@/services/dashboard-service';

interface DashboardData {
    metrics: DashboardMetrics | null;
    monthlyData: MonthlyData[];
    trafficSources: TrafficSource[];
    trafficSourcesList: TrafficSourceItem[];
    activities: ActivityLog[];
    loading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
    const [trafficSourcesList, setTrafficSourcesList] = useState<TrafficSourceItem[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await dashboardService.getDashboardData();
            
            setMetrics(data.metrics);
            setMonthlyData(data.monthlyData);
            setTrafficSources(data.trafficSources);
            setTrafficSourcesList(data.trafficSourcesList);
            setActivities(data.activities);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
            console.error('Dashboard data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        metrics,
        monthlyData,
        trafficSources,
        trafficSourcesList,
        activities,
        loading,
        error,
        refreshData: fetchData
    };
}
