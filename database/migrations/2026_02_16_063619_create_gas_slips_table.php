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
        Schema::create('gas_slips', function (Blueprint $table) {
            $table->id();
            $table->string('gas_slip_no')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->date('date')->nullable();
            $table->string('driver')->nullable();
            $table->string('vehicle_type')->nullable();
            $table->string('plate_no')->nullable();
            $table->string('purpose')->nullable();
            $table->date('date_of_travel')->nullable();

            $table->integer('odometer_before')->nullable();
            $table->integer('odometer_after')->nullable();
            $table->string('fuel_type')->nullable();
            $table->decimal('liters', 10, 2)->nullable();
            $table->decimal('amount', 10, 2)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gas_slips');
    }
};
