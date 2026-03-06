<?php

namespace App\Http\Controllers;

use App\Models\GasSlip;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GasSlipController extends Controller
{
    public function nextNumber(Request $request)
    {
        $nextNumber = DocumentNumberService::getNextDocumentNumber();

        return response()->json([
            'next' => $nextNumber,
        ]);
    }

    public function getByDocumentNo(Request $request, $documentNo)
    {
        $user = $request->user();
        $gasSlip = GasSlip::where('document_no', $documentNo)
            ->first();

        if (!$gasSlip) {
            return response()->json(['error' => 'Gas slip not found'], 404);
        }

        return response()->json($gasSlip);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'document_no' => [
                'required',
                'string',
            ],
            'date' => ['nullable', 'date'],
            'driver' => ['nullable', 'string', 'max:255'],
            'number_of_cylinder' => ['nullable', 'integer'],
            'vehicle_type' => ['nullable', 'string', 'max:255'],
            'plate_no' => ['nullable', 'string', 'max:255'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'date_of_travel_start' => ['nullable', 'date'],
            'date_of_travel_end' => ['nullable', 'date'],
            'odometer_before' => ['nullable', 'integer'],
            'odometer_after' => ['nullable', 'integer'],
            'fuel_type' => ['nullable', 'string', 'max:50'],
            'liters' => ['nullable', 'numeric'],
            'amount' => ['nullable', 'numeric'],
        ]);

        $gasSlip = DB::transaction(function () use ($data, $user) {
            // Use updateOrCreate to handle both new gas slips and updates to existing ones
            // If a gas slip with this document_no already exists (from trip ticket), update it
            // Otherwise, create a new one
            $updateData = $data;
            if (!GasSlip::where('document_no', $data['document_no'])->exists()) {
                $updateData['user_id'] = $user->id;
            }

            return GasSlip::updateOrCreate(
                [
                    'document_no' => $data['document_no'],
                ],
                $updateData
            );
        });

        return response()->json([
            'id' => $gasSlip->id,
            'document_no' => $gasSlip->document_no,
        ], 201);
    }

    // Search gas slips with filters
    public function search(Request $request)
    {
        $user = $request->user();
        
        $query = GasSlip::query();
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }
        
        // Filter by vehicle type
        if ($request->has('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }
        
        // Filter by plate number
        if ($request->has('plate_no')) {
            $query->where('plate_no', $request->plate_no);
        }
        
        // Filter by single date
        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        
        $gasSlips = $query->orderBy('date', 'desc')->get();
        
        return response()->json(['data' => $gasSlips]);
    }

    // Get gas slips for a specific month
    public function monthly(Request $request)
    {
        $user = $request->user();
        
        $year = $request->year;
        $month = $request->month;
        
        $query = GasSlip::whereYear('date', $year)
            ->whereMonth('date', $month);
        
        // Filter by vehicle type if provided
        if ($request->has('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }
        
        $gasSlips = $query->orderBy('date', 'asc')->get();
        
        return response()->json(['data' => $gasSlips]);
    }

    // Get latest odometer reading for a vehicle
    public function latestOdometer(Request $request)
    {
        $user = $request->user();
        
        $query = GasSlip::query();
        
        // Filter by vehicle type if provided
        if ($request->has('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }
        
        // Filter by plate number if provided
        if ($request->has('plate_no')) {
            $query->where('plate_no', $request->plate_no);
        }
        
        $gasSlip = $query->orderBy('date', 'desc')->first();
        
        return response()->json([
            'odometer_after' => $gasSlip ? $gasSlip->odometer_after : null,
            'odometer_before' => $gasSlip ? $gasSlip->odometer_before : null,
        ]);
    }
}
