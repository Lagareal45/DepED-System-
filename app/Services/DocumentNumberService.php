<?php

namespace App\Services;

use App\Models\TripTicket;
use App\Models\GasSlip;
use Carbon\Carbon;

class DocumentNumberService
{
    /**
     * Generate the next document number for today
     * Format: YYYY-MM-DD-###
     * 
     * Only counts Trip Tickets to ensure gas slips (which are auto-created with same number)
     * don't increment the counter
     *
     * @return string
     */
    public static function getNextDocumentNumber(): string
    {
        $today = Carbon::now()->format('Y-m-d');

        // To avoid conflicts and handle drafts claiming numbers, we determine the highest assigned sequence
        // by looking at both TripTickets and Drafts instead of just a raw count.
        $tripTicketsDocs = TripTicket::pluck('document_no')->toArray();
        $draftsDocs = \App\Models\Draft::whereNotNull('document_no')->pluck('document_no')->toArray();
        
        $allDocs = array_merge($tripTicketsDocs, $draftsDocs);
        
        $maxSequence = 0;
        foreach ($allDocs as $doc) {
            $parts = explode('-', $doc);
            if (count($parts) >= 4) {
                // The sequence number is the last part: YYYY-MM-DD-###
                $sequence = (int) end($parts);
                if ($sequence > $maxSequence) {
                    $maxSequence = $sequence;
                }
            }
        }

        // Generate the next number with format: YYYY-MM-DD-###
        $nextNumber = str_pad((string) ($maxSequence + 1), 3, '0', STR_PAD_LEFT);
        return "{$today}-{$nextNumber}";
    }
}
