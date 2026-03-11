<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TripTicket;
use App\Models\GasSlip;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getData(Request $request)
    {
        // Total Metrics
        $totalTripTickets = TripTicket::count();
        $totalGasSlips = GasSlip::count();
        $totalVehicles = TripTicket::distinct('plate_no')->count('plate_no');
        $totalFuelConsumed = GasSlip::sum('liters');

        // Past 30 days vs previous 30 days for trend percentage (Optional but good for UI)
        $last30DaysStart = Carbon::now()->subDays(30);
        $prev30DaysStart = Carbon::now()->subDays(60);

        // Trips Trends
        $recentTrips = TripTicket::where('created_at', '>=', $last30DaysStart)->count();
        $prevTrips = TripTicket::whereBetween('created_at', [$prev30DaysStart, $last30DaysStart])->count();
        $tripsChange = $this->calculatePercentageChange($prevTrips, $recentTrips);

        // Gas Slips Trends
        $recentGasSlips = GasSlip::where('created_at', '>=', $last30DaysStart)->count();
        $prevGasSlips = GasSlip::whereBetween('created_at', [$prev30DaysStart, $last30DaysStart])->count();
        $gasSlipsChange = $this->calculatePercentageChange($prevGasSlips, $recentGasSlips);
        
        // Active Vehicles Trends (just comparing rough count in last 30 days)
        $recentVehicles = TripTicket::where('created_at', '>=', $last30DaysStart)->distinct('plate_no')->count('plate_no');
        $prevVehicles = TripTicket::whereBetween('created_at', [$prev30DaysStart, $last30DaysStart])->distinct('plate_no')->count('plate_no');
        $vehiclesChange = $this->calculatePercentageChange($prevVehicles, $recentVehicles);

        // Fuel Trends
        $recentFuel = GasSlip::where('created_at', '>=', $last30DaysStart)->sum('liters');
        $prevFuel = GasSlip::whereBetween('created_at', [$prev30DaysStart, $last30DaysStart])->sum('liters');
        $fuelChange = $this->calculatePercentageChange($prevFuel, $recentFuel);

        
        // Monthly Data (Last 6 Months)
        $monthlyData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->startOfMonth()->subMonths($i);
            $monthEnd = Carbon::now()->endOfMonth()->subMonths($i);
            
            $monthName = $monthStart->format('M');
            
            $tripsCount = TripTicket::whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $fuelSum = GasSlip::whereBetween('created_at', [$monthStart, $monthEnd])->sum('liters');
            
            // Break down fuel for the overview chart
            $gasolineSum = GasSlip::whereBetween('created_at', [$monthStart, $monthEnd])->where('fuel_type', 'Gasoline')->sum('liters');
            $dieselSum = GasSlip::whereBetween('created_at', [$monthStart, $monthEnd])->where('fuel_type', 'Diesel')->sum('liters');
            $unknownSum = GasSlip::whereBetween('created_at', [$monthStart, $monthEnd])->where(function($q) {
                $q->whereNull('fuel_type')->orWhere('fuel_type', '');
            })->sum('liters');
            
            $monthlyData[] = [
                'month' => $monthName,
                'trips' => $tripsCount,
                'fuel' => round($fuelSum, 2),
                'gasoline' => round($gasolineSum, 2),
                'diesel' => round($dieselSum, 2),
                'unknown_fuel' => round($unknownSum, 2),
            ];
        }

        // Fuel Types Distribution Data (Traffic Sources replacement)
        $fuelTypesRaw = GasSlip::select('fuel_type', DB::raw('SUM(liters) as total_liters'))
                            ->groupBy('fuel_type')
                            ->orderBy('total_liters', 'desc')
                            ->get();
                            
        $totalLitersAllType = $fuelTypesRaw->sum('total_liters');
                            
        // Standardize colors so PieChart matches Overview chart
        $fuelColorMap = [
            'Unknown' => '#9ca3af',   // Grey (changed from purple so Trips can keep purple)
            'Diesel' => '#3b82f6',    // Blue
            'Gasoline' => '#10b981',  // Green
        ];
        $defaultColors = ['#f59e0b', '#ef4444', '#14b8a6'];
        
        $trafficSources = [];
        $trafficSourcesList = [];

        foreach ($fuelTypesRaw as $index => $fuelItem) {
            $fuelTypeName = $fuelItem->fuel_type ?: 'Unknown';
            $liters = floatval($fuelItem->total_liters);
            
            $percent = $totalLitersAllType > 0 ? round(($liters / $totalLitersAllType) * 100, 1) : 0;
            
            // Apply mapped color, fallback to defaults if adding weird new fuel types
            $color = $fuelColorMap[$fuelTypeName] ?? ($defaultColors[$index % count($defaultColors)]);
            
            $trafficSources[] = [
                'name' => $fuelTypeName,
                'value' => $percent,
                'color' => $color
            ];
            
            $trafficSourcesList[] = [
                'source' => $fuelTypeName,
                'visitors' => number_format($liters, 2) . ' L', // repurposing structure
                'percentage' => $percent,
                'trend' => 'up' // static for now
            ];
        }
        
        // If entirely empty list, just show a placeholder to avoid breaking chart
        if (empty($trafficSources)) {
             $trafficSources[] = [
                'name' => 'No Data',
                'value' => 100,
                'color' => '#d1d5db'
            ];
        }

        // Monthly Goals (e.g. Total distance, Monthly Fuel Budget, etc.)
        $monthlyGoals = [
             [
                 'title' => 'Monthly Fuel Consumed', 
                 'current' => round($recentFuel, 2), 
                 'target' => 500, // Example Target
                 'percentage' => $recentFuel > 0 ? min(round(($recentFuel / 500) * 100), 100) : 0 
             ],
             [
                 'title' => 'Monthly Trips', 
                 'current' => $recentTrips, 
                 'target' => 50, // Example Target
                 'percentage' => $recentTrips > 0 ? min(round(($recentTrips / 50) * 100), 100) : 0
             ],
             [
                 'title' => 'Active Vehicles', 
                 'current' => $recentVehicles, 
                 'target' => 10,  // Example Target
                 'percentage' => $recentVehicles > 0 ? min(round(($recentVehicles / 10) * 100), 100) : 0
             ],
        ];


        return response()->json([
            'metrics' => [
                'totalTripTickets' => $totalTripTickets,
                'totalGasSlips' => $totalGasSlips,
                'totalVehicles' => $totalVehicles,
                'totalFuelConsumed' => round($totalFuelConsumed, 2),
                'tripsChange' => round($tripsChange, 1),
                'gasSlipsChange' => round($gasSlipsChange, 1),
                'vehiclesChange' => round($vehiclesChange, 1),
                'fuelChange' => round($fuelChange, 1),
            ],
            'monthlyData' => $monthlyData,
            'trafficSources' => $trafficSources,
            'trafficSourcesList' => $trafficSourcesList,
            'monthlyGoals' => $monthlyGoals,
        ]);
    }
    
    private function calculatePercentageChange($oldValue, $newValue) 
    {
        if ($oldValue == 0) {
            return $newValue > 0 ? 100 : 0; 
        }
        return (($newValue - $oldValue) / $oldValue) * 100;
    }
}
