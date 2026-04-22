<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Draft extends Model
{
    protected $fillable = [
        'user_id',
        'form_type',
        'document_no',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];
}
