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
            $table->decimal('gasoline_total_litres', 8, 2)->nullable()->after('gasoline_purchased');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_tickets', function (Blueprint $table) {
            $table->dropColumn('gasoline_total_litres');
        });
    }
};
