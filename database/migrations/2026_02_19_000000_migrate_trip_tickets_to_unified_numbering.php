<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trip_tickets', function (Blueprint $table) {
            // Add new unified document_no column as nullable
            $table->string('document_no')->nullable()->unique()->after('id');
        });

        // Generate document numbers for existing records
        $today = Carbon::now()->format('Y-m-d');
        $tickets = DB::table('trip_tickets')->whereNull('document_no')->orderBy('id')->get();
        
        foreach ($tickets as $idx => $ticket) {
            $num = str_pad((string) ($idx + 1), 3, '0', STR_PAD_LEFT);
            DB::table('trip_tickets')
                ->where('id', $ticket->id)
                ->update(['document_no' => "{$today}-{$num}"]);
        }

        Schema::table('trip_tickets', function (Blueprint $table) {
            // Now drop the old trip_ticket_no constraint and column
            $table->dropUnique(['trip_ticket_no']);
            $table->dropColumn('trip_ticket_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_tickets', function (Blueprint $table) {
            $table->dropColumn('document_no');
        });

        Schema::table('trip_tickets', function (Blueprint $table) {
            $table->unsignedBigInteger('trip_ticket_no')->unique()->after('id');
        });
    }
};
