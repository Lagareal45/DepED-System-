<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripTicket extends Model
{
    protected $fillable = [
        'document_no',
        'user_id',
        'date',
        'driver',
        'vehicle',
        'plate_no',
        'authorized_passengers',
        'destinations',
        'purpose',
        'departure_time',
        'arrival_at_place',
        'departure_from_place',
        'arrival_back_time',
        'distance_travelled',
        'gasoline_balance_in_tank',
        'gasoline_issued',
        'gasoline_purchased',
        'gasoline_deducted',
        'gear_oil_used',
        'lubricants_used',
        'greased_oil_used',
        'speed_at_beginning',
        'speed_distance_travelled',
        'speed_at_end',
        'remarks',
        'driver_signature',
        'passenger_signatures',
    ];

    protected $casts = [
        'destinations' => 'array',
        'date' => 'date',
    ];
}
