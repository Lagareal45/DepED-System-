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
        Schema::create('trip_tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('trip_ticket_no')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->date('date')->nullable();
            $table->string('driver')->nullable();
            $table->string('vehicle')->nullable();
            $table->string('plate_no')->nullable();
            $table->string('authorized_passengers')->nullable();
            $table->json('destinations')->nullable();
            $table->string('purpose')->nullable();

            $table->string('departure_time')->nullable();
            $table->string('arrival_at_place')->nullable();
            $table->string('departure_from_place')->nullable();
            $table->string('arrival_back_time')->nullable();
            $table->decimal('distance_travelled', 10, 2)->nullable();

            $table->decimal('gasoline_balance_in_tank', 10, 2)->nullable();
            $table->decimal('gasoline_issued', 10, 2)->nullable();
            $table->decimal('gasoline_purchased', 10, 2)->nullable();
            $table->decimal('gasoline_deducted', 10, 2)->nullable();

            $table->decimal('gear_oil_used', 10, 2)->nullable();
            $table->decimal('lubricants_used', 10, 2)->nullable();
            $table->decimal('greased_oil_used', 10, 2)->nullable();

            $table->decimal('speed_at_beginning', 10, 2)->nullable();
            $table->decimal('speed_distance_travelled', 10, 2)->nullable();
            $table->decimal('speed_at_end', 10, 2)->nullable();

            $table->text('remarks')->nullable();
            $table->string('driver_signature')->nullable();
            $table->string('passenger_signatures')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_tickets');
    }
};
