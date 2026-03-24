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

        // Count all trip tickets to ensure numbering is continuous across days
        // Gas slips are either created from trip tickets (same number) 
        // or independently, but we use trip tickets as the primary sequence
        $tripTicketsCount = TripTicket::count();

        // Generate the next number with format: YYYY-MM-DD-###
        $nextNumber = str_pad((string) ($tripTicketsCount + 1), 3, '0', STR_PAD_LEFT);
        return "{$today}-{$nextNumber}";
    }
}
