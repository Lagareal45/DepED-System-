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
                    'user_id' => $user->id,
                ],
                [
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
        $user = $request->user();

        $date = $request->input('date');
        $driver = $request->input('driver');
        $vehicle = $request->input('vehicle') ?? $request->input('vehicle_type');

        $query = TripTicket::where('user_id', $user->id);

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

            // Fetch matching gas slip for this ticket (by document_no and user_id)
            $gasSlip = GasSlip::where('document_no', $ticket->document_no)
                ->where('user_id', $ticket->user_id)
                ->first();

            $numberOfCylinder = $gasSlip ? $gasSlip->number_of_cylinder : null;

            if (!isset($reportData[$dateKey])) {
                $reportData[$dateKey] = [
                    'day' => $dayOfMonth,
                    'date' => $dateKey,
                    'vehicle' => $ticket->vehicle ?? '',
                    'distance_start' => $ticket->speed_at_beginning ?? '',
                    'distance_end' => $ticket->speed_at_end ?? '',
                    'oil_used' => $ticket->gear_oil_used ?? 0,
                    'grease_used' => $ticket->greased_oil_used ?? 0,
                    'remarks' => $ticket->remarks ?? '',
                    'number_of_cylinder' => $numberOfCylinder,
                ];
            } else {
                // Aggregate values for same date
                $reportData[$dateKey]['oil_used'] += $ticket->gear_oil_used ?? 0;
                $reportData[$dateKey]['grease_used'] = ($reportData[$dateKey]['grease_used'] ?? 0) + ($ticket->greased_oil_used ?? 0);
                if ($ticket->remarks) {
                    $reportData[$dateKey]['remarks'] = ($reportData[$dateKey]['remarks'] ? $reportData[$dateKey]['remarks'] . '; ' : '') . $ticket->remarks;
                }
                // If number_of_cylinder is not set yet, set it if available
                if (!isset($reportData[$dateKey]['number_of_cylinder']) && $numberOfCylinder !== null) {
                    $reportData[$dateKey]['number_of_cylinder'] = $numberOfCylinder;
                }
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
            'report_date' => $date ? date('F Y', strtotime($date)) : ($firstTicket && $firstTicket->date ? $firstTicket->date->format('F Y') : date('F Y')),
        ]);
    }
}
