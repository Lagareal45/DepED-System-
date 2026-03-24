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
        Schema::table('trip_tickets', function (Blueprint $table) {
            $table->decimal('total_gasoline', 8, 2)->nullable()->after('gasoline_final_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_tickets', function (Blueprint $table) {
            $table->dropColumn('total_gasoline');
        });
    }
};
