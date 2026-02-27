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
            ->where('user_id', $user->id)
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
                // Allow same document_no for current user's gas slip (for updateOrCreate)
                function ($attribute, $value, $fail) use ($user) {
                    $exists = GasSlip::where('document_no', $value)
                        ->where('user_id', '!=', $user->id)
                        ->exists();
                    if ($exists) {
                        $fail('The document no has already been taken.');
                    }
                },
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
            return GasSlip::updateOrCreate(
                [
                    'document_no' => $data['document_no'],
                    'user_id' => $user->id,
                ],
                $data
            );
        });

        return response()->json([
            'id' => $gasSlip->id,
            'document_no' => $gasSlip->document_no,
        ], 201);
    }
}
