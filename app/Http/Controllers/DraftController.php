<?php

namespace App\Http\Controllers;

use App\Models\Draft;
use Illuminate\Http\Request;

class DraftController extends Controller
{
    public function index(Request $request)
    {
        $drafts = Draft::where('user_id', $request->user()->id)->orderBy('created_at', 'desc')->get();
        return response()->json($drafts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => ['nullable', 'exists:drafts,id'],
            'form_type' => ['required', 'string'],
            'document_no' => ['nullable', 'string'],
            'data' => ['required', 'array'],
        ]);

        $draft = null;

        if (!empty($validated['id'])) {
            $draft = Draft::where('user_id', $request->user()->id)->find($validated['id']);
        }

        if ($draft) {
            $draft->update([
                'form_type' => $validated['form_type'],
                'document_no' => $validated['document_no'] ?? null,
                'data' => $validated['data'],
            ]);
        } else {
            $draft = Draft::create([
                'user_id' => $request->user()->id,
                'form_type' => $validated['form_type'],
                'document_no' => $validated['document_no'] ?? null,
                'data' => $validated['data'],
            ]);
        }

        // Auto-create or sync Gas Slip draft when Trip Ticket draft is saved
        if ($validated['form_type'] === 'Trip Ticket' && !empty($validated['document_no'])) {
            $gasSlipDraft = Draft::where('user_id', $request->user()->id)
                ->where('form_type', 'Gas Slip')
                ->where('document_no', $validated['document_no'])
                ->first();
            
            $gasSlipData = $gasSlipDraft ? $gasSlipDraft->data : [];
            $gasSlipData['documentNo'] = $validated['document_no'];
            
            if (isset($validated['data']['driver'])) $gasSlipData['driver'] = $validated['data']['driver'];
            if (isset($validated['data']['vehicle'])) $gasSlipData['vehicleType'] = $validated['data']['vehicle'];
            if (isset($validated['data']['plateNo'])) $gasSlipData['plateNo'] = $validated['data']['plateNo'];
            if (isset($validated['data']['purpose'])) $gasSlipData['purpose'] = $validated['data']['purpose'];
            if (isset($validated['data']['date'])) $gasSlipData['date'] = $validated['data']['date'];
            if (isset($validated['data']['speedAtBeginning'])) $gasSlipData['odometerBefore'] = $validated['data']['speedAtBeginning'];
            if (isset($validated['data']['speedAtEnd'])) $gasSlipData['odometerAfter'] = $validated['data']['speedAtEnd'];

            if ($gasSlipDraft) {
                $gasSlipDraft->update(['data' => $gasSlipData]);
            } else {
                Draft::create([
                    'user_id' => $request->user()->id,
                    'form_type' => 'Gas Slip',
                    'document_no' => $validated['document_no'],
                    'data' => $gasSlipData,
                ]);
            }
        }

        return response()->json($draft, 201);
    }

    public function destroy(Request $request, Draft $draft)
    {
        if ($draft->user_id === $request->user()->id) {
            $documentNo = $draft->document_no;
            $formType = $draft->form_type;

            $draft->delete();

            if ($formType === 'Trip Ticket' && !empty($documentNo)) {
                Draft::where('user_id', $request->user()->id)
                    ->where('form_type', 'Gas Slip')
                    ->where('document_no', $documentNo)
                    ->delete();
            }

            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }
}
