// Dashboard data service - connects to actual system data
export interface DashboardMetrics {
    totalRevenue: number;
    activeUsers: number;
    totalOrders: number;
    pageViews: number;
    revenueChange: number;
    usersChange: number;
    ordersChange: number;
    viewsChange: number;
}

export interface MonthlyData {
    month: string;
    revenue: number;
    orders: number;
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

class DashboardService {
    // Simulate API calls - replace with actual API endpoints
    async getMetrics(): Promise<DashboardMetrics> {
        // In a real application, this would be an API call:
        // const response = await fetch('/api/dashboard/metrics');
        // return response.json();
        
        // For now, return simulated data that could come from your system
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    totalRevenue: 45678,
                    activeUsers: 8942,
                    totalOrders: 1256,
                    pageViews: 45678,
                    revenueChange: 12.5,
                    usersChange: -2.4,
                    ordersChange: 8.1,
                    viewsChange: 15.3
                });
            }, 100);
        });
    }

    async getMonthlyData(): Promise<MonthlyData[]> {
        // In a real application, this would fetch from your database
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    { month: 'Jan', revenue: 12000, orders: 180 },
                    { month: 'Feb', revenue: 15000, orders: 220 },
                    { month: 'Mar', revenue: 13500, orders: 195 },
                    { month: 'Apr', revenue: 18000, orders: 260 },
                    { month: 'May', revenue: 22000, orders: 310 },
                    { month: 'Jun', revenue: 25678, orders: 351 },
                ]);
            }, 100);
        });
    }

    async getTrafficSources(): Promise<{ sources: TrafficSource[], list: TrafficSourceItem[] }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const sources = [
                    { name: 'Direct', value: 35, color: '#8b5cf6' },
                    { name: 'Social', value: 25, color: '#3b82f6' },
                    { name: 'Referral', value: 20, color: '#10b981' },
                    { name: 'Organic', value: 20, color: '#f59e0b' },
                ];

                const list = [
                    { source: 'Direct', visitors: '3,542', percentage: 35, trend: 'up' as const },
                    { source: 'Social', visitors: '2,531', percentage: 25, trend: 'up' as const },
                    { source: 'Referral', visitors: '2,024', percentage: 20, trend: 'down' as const },
                    { source: 'Organic', visitors: '2,024', percentage: 20, trend: 'up' as const },
                ];

                resolve({ sources, list });
            }, 100);
        });
    }

    async getMonthlyGoals(): Promise<MonthlyGoal[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    { title: 'Monthly Revenue', current: 25678, target: 30000, percentage: 85 },
                    { title: 'New Customers', current: 894, target: 1000, percentage: 89 },
                    { title: 'Conversion Rate', current: 3.2, target: 4.0, percentage: 80 },
                ]);
            }, 100);
        });
    }

    // Method to get all dashboard data at once
    async getDashboardData() {
        const [metrics, monthlyData, trafficData, goals] = await Promise.all([
            this.getMetrics(),
            this.getMonthlyData(),
            this.getTrafficSources(),
            this.getMonthlyGoals()
        ]);

        return {
            metrics,
            monthlyData,
            trafficSources: trafficData.sources,
            trafficSourcesList: trafficData.list,
            monthlyGoals: goals
        };
    }
}

export const dashboardService = new DashboardService();
