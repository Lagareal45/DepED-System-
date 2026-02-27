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
            $table->date('date_of_travel_start')->nullable()->after('purpose');
            $table->date('date_of_travel_end')->nullable()->after('date_of_travel_start');
            $table->dropColumn('date_of_travel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gas_slips', function (Blueprint $table) {
            $table->date('date_of_travel')->nullable()->after('purpose');
            $table->dropColumn('date_of_travel_start');
            $table->dropColumn('date_of_travel_end');
        });
    }
};
