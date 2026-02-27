<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GasSlip extends Model
{
    protected $fillable = [
        'document_no',
        'user_id',
        'date',
        'driver',
        'number_of_cylinder',
        'vehicle_type',
        'plate_no',
        'purpose',
        'date_of_travel_start',
        'date_of_travel_end',
        'odometer_before',
        'odometer_after',
        'fuel_type',
        'liters',
        'amount',
    ];

    protected $casts = [
        'date' => 'date',
        'date_of_travel_start' => 'date',
        'date_of_travel_end' => 'date',
        'liters' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
