import { Head } from '@inertiajs/react';
import { FileText, FileSpreadsheet, Car, Droplet, ArrowUp, ArrowDown, RefreshCw, Eye } from 'lucide-react';
import { ComposedChart, Line, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { printOrSavePDF } from '@/lib/pdf-utils';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

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
        activities,
        drafts,
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
                            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="gasoline" stackId="a" fill="#10b981" name="Gasoline (L)" radius={[0, 0, 4, 4]} />
                                <Bar yAxisId="left" dataKey="diesel" stackId="a" fill="#3b82f6" name="Diesel (L)" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="linear" dataKey="trips" stroke="#8b5cf6" strokeWidth={3} name="Total Trips" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </ComposedChart>
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

                {/* Saved Drafts */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Saved Drafts</h2>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                            {drafts.length} Pending
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Form Type</th>
                                    <th className="px-6 py-3 font-semibold">Driver</th>
                                    <th className="px-6 py-3 font-semibold">Last Updated</th>
                                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {drafts.length > 0 ? (
                                    drafts.map((draft) => (
                                        <tr key={draft.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className={`p-1.5 rounded-md mr-3 ${
                                                        draft.form_type === 'Trip Ticket' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {draft.form_type === 'Trip Ticket' ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{draft.form_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{draft.data?.driver || 'Unspecified'}</td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {new Date(draft.updated_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a
                                                    href={draft.form_type === 'Trip Ticket' ? `/trip-tickets?draft_id=${draft.id}` : `/gas-slips?draft_id=${draft.id}`}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none transition-colors"
                                                >
                                                    Continue Filling
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                                            No saved drafts found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Logs */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Recent
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Activity Type</th>
                                    <th className="px-6 py-3 font-semibold">Document No.</th>
                                    <th className="px-6 py-3 font-semibold">Driver</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 font-semibold">Time</th>
                                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activities.length > 0 ? (
                                    activities.map((activity, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className={`p-1.5 rounded-md mr-3 ${
                                                        activity.type === 'Trip Ticket' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {activity.type === 'Trip Ticket' ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{activity.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{activity.document_no}</td>
                                            <td className="px-6 py-4">{activity.driver}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    {activity.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">{activity.timestamp}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => printOrSavePDF(activity.type, activity.data)}
                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none transition-colors"
                                                    title="View PDF"
                                                >
                                                    <Eye size={14} className="mr-1" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                                            No recent activities found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
