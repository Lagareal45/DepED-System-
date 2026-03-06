<?php

namespace App\Http\Controllers;

use App\Models\TripTicket;
use App\Models\GasSlip;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TripTicketController extends Controller
{
    public function nextNumber(Request $request)
    {
        $nextNumber = DocumentNumberService::getNextDocumentNumber();

        return response()->json([
            'next' => $nextNumber,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'document_no' => ['required', 'string', 'unique:trip_tickets'],
            'date' => ['nullable', 'date'],
            'driver' => ['nullable', 'string', 'max:255'],
            'vehicle' => ['nullable', 'string', 'max:255'],
            'plate_no' => ['nullable', 'string', 'max:255'],
            'authorized_passengers' => ['nullable', 'string', 'max:255'],
            'destinations' => ['nullable', 'array'],
            'destinations.*' => ['nullable', 'string', 'max:255'],
            'purpose' => ['nullable', 'string', 'max:255'],

            'departure_time' => ['nullable', 'string', 'max:50'],
            'arrival_at_place' => ['nullable', 'string', 'max:50'],
            'departure_from_place' => ['nullable', 'string', 'max:50'],
            'arrival_back_time' => ['nullable', 'string', 'max:50'],
            'distance_travelled' => ['nullable', 'numeric'],

            'gasoline_balance_in_tank' => ['nullable', 'numeric'],
            'gasoline_issued' => ['nullable', 'numeric'],
            'gasoline_purchased' => ['nullable', 'numeric'],
            'gasoline_deducted' => ['nullable', 'numeric'],

            'gear_oil_used' => ['nullable', 'numeric'],
            'lubricants_used' => ['nullable', 'numeric'],
            'greased_oil_used' => ['nullable', 'numeric'],

            'speed_at_beginning' => ['nullable', 'numeric'],
            'speed_distance_travelled' => ['nullable', 'numeric'],
            'speed_at_end' => ['nullable', 'numeric'],

            'remarks' => ['nullable', 'string'],
            'driver_signature' => ['nullable', 'string', 'max:255'],
            'passenger_signatures' => ['nullable', 'string', 'max:255'],
        ]);

        $ticket = DB::transaction(function () use ($data, $user) {
            // Create trip ticket
            $tripTicket = TripTicket::create([
                ...$data,
                'user_id' => $user->id,
            ]);

            // Automatically create or update matching gas slip with the same document_no
            GasSlip::updateOrCreate(
                [
                    'document_no' => $tripTicket->document_no,
                ],
                [
                    'user_id' => $user->id,
                    'date' => $data['date'] ?? null,
                    'driver' => $data['driver'] ?? null,
                    'plate_no' => $data['plate_no'] ?? null,
                    'purpose' => $data['purpose'] ?? null,
                ]
            );

            return $tripTicket;
        });

        return response()->json([
            'id' => $ticket->id,
            'document_no' => $ticket->document_no,
        ], 201);
    }

    public function monthlyReport(Request $request)
    {
        try {
            $user = $request->user();

            $date = $request->input('date');
            $driver = $request->input('driver');
            $vehicle = $request->input('vehicle') ?? $request->input('vehicle_type');

            $query = TripTicket::query();

            if ($date) {
                $query->whereYear('date', date('Y', strtotime($date)))
                      ->whereMonth('date', date('m', strtotime($date)));
            }

            if ($driver) {
                $query->where('driver', 'like', '%' . $driver . '%');
            }

            if ($vehicle) {
                $query->where('vehicle', 'like', '%' . $vehicle . '%');
            }

            $tickets = $query->orderBy('date', 'asc')->get();

            // Group by date and aggregate data
            $reportData = [];
            $firstTicket = $tickets->first();
            
            foreach ($tickets as $ticket) {
                if (!$ticket->date) {
                    continue;
                }
                $dateKey = $ticket->date->format('Y-m-d');
                $dayOfMonth = (int)$ticket->date->format('d');

                // Fetch matching gas slip for this ticket (by document_no)
                $gasSlip = GasSlip::where('document_no', $ticket->document_no)
                    ->first();

                $numberOfCylinder = $gasSlip ? $gasSlip->number_of_cylinder : null;
                
                // Calculate distance traveled using odometer readings
                $distanceTraveled = null;
                if ($gasSlip && isset($gasSlip->odometer_before) && isset($gasSlip->odometer_after) && $gasSlip->odometer_before !== null && $gasSlip->odometer_after !== null) {
                    $distanceTraveled = (float) $gasSlip->odometer_after - (float) $gasSlip->odometer_before;
                }
                
                // Get gasoline consumed from gasoline deducted field
                $gasolineConsumed = null;
                if ($ticket && isset($ticket->gasoline_deducted) && $ticket->gasoline_deducted !== null) {
                    $gasolineConsumed = (float) $ticket->gasoline_deducted;
                }

                if (!isset($reportData[$dateKey])) {
                    $reportData[$dateKey] = [
                        'day' => $dayOfMonth,
                        'date' => $dateKey,
                        'vehicle' => $ticket->vehicle ?? '',
                        'distance_start' => $ticket->speed_at_beginning ?? '',
                        'distance_end' => $ticket->speed_at_end ?? '',
                        'distance_traveled' => null,
                        'odometer_before' => null,
                        'odometer_after' => null,
                        'gasoline_consumed' => null,
                        'total_fuel_used' => 0, // Will be incremented below
                        'oil_used' => 0,
                        'grease_used' => 0,
                        'remarks' => '',
                        'number_of_cylinder' => null,
                    ];
                }
                // 1. Calculate the formula variables
                $a = (float)($ticket->gasoline_balance_in_tank ?? 0);
                $b = (float)($ticket->gasoline_issued ?? 0);
                $c = (float)($ticket->gasoline_purchased ?? 0);
                $e = (float)($ticket->gasoline_deducted ?? 0);
                
                // f. Balance in tank(Liters) = a + b + c - e
                $f = $a + $b + $c - $e;
                
                // User requested formula: "a. Balance in tank" + "c. purchased" - "f. Balance in tank" = "Total Fuel Used"
                $totalFuelUsed = $a + $c - $f;
                // Accumulate total fuel used for the date
                $reportData[$dateKey]['total_fuel_used'] += $totalFuelUsed;

                // Aggregate values for same date
                $reportData[$dateKey]['oil_used'] = ($reportData[$dateKey]['oil_used'] ?? 0) + ($ticket->gear_oil_used ?? 0);
                $reportData[$dateKey]['grease_used'] = ($reportData[$dateKey]['grease_used'] ?? 0) + ($ticket->greased_oil_used ?? 0);
                
                // For distance traveled, add to existing if there's already a value
                if ($distanceTraveled !== null) {
                    $reportData[$dateKey]['distance_traveled'] = ($reportData[$dateKey]['distance_traveled'] ?? 0) + $distanceTraveled;
                }
                
                // For gasoline consumed, add to existing if there's already a value
                if ($gasolineConsumed !== null) {
                    $reportData[$dateKey]['gasoline_consumed'] = ($reportData[$dateKey]['gasoline_consumed'] ?? 0) + $gasolineConsumed;
                }
                
                // Update odometer readings if they're not set yet (use first available readings)
                if (!isset($reportData[$dateKey]['odometer_before']) && $reportData[$dateKey]['odometer_before'] === null && $gasSlip && isset($gasSlip->odometer_before) && $gasSlip->odometer_before !== null) {
                    $reportData[$dateKey]['odometer_before'] = $gasSlip->odometer_before;
                }
                if (!isset($reportData[$dateKey]['odometer_after']) && $reportData[$dateKey]['odometer_after'] === null && $gasSlip && isset($gasSlip->odometer_after) && $gasSlip->odometer_after !== null) {
                    $reportData[$dateKey]['odometer_after'] = $gasSlip->odometer_after;
                }
                
                if ($ticket->remarks) {
                    $reportData[$dateKey]['remarks'] = ($reportData[$dateKey]['remarks'] ? $reportData[$dateKey]['remarks'] . '; ' : '') . $ticket->remarks;
                }
                // If number_of_cylinder is not set yet, set it if available
                if (!isset($reportData[$dateKey]['number_of_cylinder']) && $numberOfCylinder !== null) {
                    $reportData[$dateKey]['number_of_cylinder'] = $numberOfCylinder;
                }
            }

            // Convert to array and sort by day
            $reportArray = array_values($reportData);
            usort($reportArray, function ($a, $b) {
                return ($a['day'] ?? 0) - ($b['day'] ?? 0);
            });

            return response()->json([
                'data' => $reportArray,
                'driver' => $firstTicket->driver ?? '',
                'plate_no' => $firstTicket->plate_no ?? '',
                'report_date' => $date ? date('F j, Y', strtotime($date)) : ($firstTicket && $firstTicket->date ? $firstTicket->date->format('F j, Y') : date('F j, Y')),
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Monthly Report Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to generate monthly report: ' . $e->getMessage(),
                'data' => [],
                'driver' => '',
                'plate_no' => '',
                'report_date' => date('F j, Y'),
            ], 500);
        }
    }
}
