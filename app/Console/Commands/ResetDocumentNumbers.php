<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ResetDocumentNumbers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:reset-numbers';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all Trip Ticket and Gas Slip document numbers to start from 001 for today';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::now()->format('Y-m-d');

        // Get all trip tickets ordered by id
        $tripTickets = DB::table('trip_tickets')->orderBy('id')->get();
        $count = 1;
        foreach ($tripTickets as $ticket) {
            $num = str_pad((string) $count, 3, '0', STR_PAD_LEFT);
            $docNo = "$today-$num";
            DB::table('trip_tickets')->where('id', $ticket->id)->update(['document_no' => $docNo]);
            // Also update matching gas slip if exists
            DB::table('gas_slips')->where('user_id', $ticket->user_id)->where('document_no', $ticket->document_no)->update(['document_no' => $docNo]);
            $count++;
        }

        // For any gas slips not linked to a trip ticket, assign new numbers after the last
        $gasSlips = DB::table('gas_slips')->whereNotIn('document_no', $tripTickets->pluck('document_no'))->orderBy('id')->get();
        foreach ($gasSlips as $slip) {
            $num = str_pad((string) $count, 3, '0', STR_PAD_LEFT);
            $docNo = "$today-$num";
            DB::table('gas_slips')->where('id', $slip->id)->update(['document_no' => $docNo]);
            $count++;
        }

        $this->info('All document numbers have been reset to start from 001 for today.');
    }
}