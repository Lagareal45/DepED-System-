import axios from 'axios';

// Dashboard data service - connects to actual system data
export interface DashboardMetrics {
    totalTripTickets: number;
    totalGasSlips: number;
    totalVehicles: number;
    totalFuelConsumed: number;
    tripsChange: number;
    gasSlipsChange: number;
    vehiclesChange: number;
    fuelChange: number;
}

export interface MonthlyData {
    month: string;
    trips: number;
    fuel: number;
}

export interface TrafficSource {
    name: string;
    value: number;
    color: string;
}

export interface TrafficSourceItem {
    source: string;
    visitors: string;
    percentage: number;
    trend: 'up' | 'down';
}

export interface MonthlyGoal {
    title: string;
    current: number;
    target: number;
    percentage: number;
}

export interface DashboardDataResponse {
    metrics: DashboardMetrics;
    monthlyData: MonthlyData[];
    trafficSources: TrafficSource[];
    trafficSourcesList: TrafficSourceItem[];
    monthlyGoals: MonthlyGoal[];
}

class DashboardService {
    // Fetch all dashboard data from the API at once
    async getDashboardData(): Promise<DashboardDataResponse> {
        try {
            const response = await axios.get('/api/dashboard/data');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
