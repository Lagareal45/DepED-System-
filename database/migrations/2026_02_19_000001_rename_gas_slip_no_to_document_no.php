<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('gas_slips', function (Blueprint $table) {
            // Rename gas_slip_no to document_no for consistency
            $table->renameColumn('gas_slip_no', 'document_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gas_slips', function (Blueprint $table) {
            $table->renameColumn('document_no', 'gas_slip_no');
        });
    }
};
