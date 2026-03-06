import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, FileSpreadsheet, Car, Droplet, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const {
        metrics,
        monthlyData,
        trafficSources,
        trafficSourcesList,
        monthlyGoals,
        loading,
        error,
        refreshData
    } = useDashboardData();

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-6">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">Error loading dashboard: {error}</p>
                        <button
                            onClick={refreshData}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header with refresh button */}
                <div className="flex justify-end items-center">
                    <button
                        onClick={refreshData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-100 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Trip Tickets</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics?.totalTripTickets.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    {metrics?.tripsChange && metrics.tripsChange > 0 ? (
                                        <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                                    )}
                                    <span className={`text-sm ${metrics?.tripsChange && metrics.tripsChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {Math.abs(metrics?.tripsChange || 0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Gas Slips</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics?.totalGasSlips.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    {metrics?.gasSlipsChange && metrics.gasSlipsChange > 0 ? (
                                        <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                                    )}
                                    <span className={`text-sm ${metrics?.gasSlipsChange && metrics.gasSlipsChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {Math.abs(metrics?.gasSlipsChange || 0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Vehicles</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics?.totalVehicles.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    {metrics?.vehiclesChange && metrics.vehiclesChange > 0 ? (
                                        <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                                    )}
                                    <span className={`text-sm ${metrics?.vehiclesChange && metrics.vehiclesChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {Math.abs(metrics?.vehiclesChange || 0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Car className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Fuel Consumed (Liters)</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics?.totalFuelConsumed.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    {metrics?.fuelChange && metrics.fuelChange > 0 ? (
                                        <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                                    )}
                                    <span className={`text-sm ${metrics?.fuelChange && metrics.fuelChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {Math.abs(metrics?.fuelChange || 0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-lg">
                                <Droplet className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overview and Traffic Sources */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overview Chart */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="trips" stroke="#8b5cf6" strokeWidth={2} name="Trips" />
                                <Line type="monotone" dataKey="fuel" stroke="#3b82f6" strokeWidth={2} name="Fuel (Liters)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Fuel Types Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fuel Types</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={trafficSources}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {trafficSources.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {trafficSourcesList.map((source, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: trafficSources[index]?.color }}
                                        />
                                        <span className="text-sm text-gray-600">{source.source}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-900 mr-2">{source.visitors}</span>
                                        {source.trend === 'up' ? (
                                            <ArrowUp className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <ArrowDown className="w-3 h-3 text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Monthly Goals */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Goals</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {monthlyGoals.map((goal, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">{goal.title}</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {goal.title === 'Conversion Rate'
                                            ? `${goal.current}%`
                                            : goal.title === 'New Customers'
                                                ? goal.current.toLocaleString()
                                                : `₱${goal.current.toLocaleString()}`
                                        }
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${goal.percentage}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">{goal.percentage}%</span>
                                    <span className="text-xs text-gray-500">
                                        Target: {goal.title === 'Conversion Rate'
                                            ? `${goal.target}%`
                                            : goal.title === 'New Customers'
                                                ? goal.target.toLocaleString()
                                                : `₱${goal.target.toLocaleString()}`
                                        }
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
