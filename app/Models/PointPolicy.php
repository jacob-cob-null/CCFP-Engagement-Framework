<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointPolicy extends Model
{
    protected $table = 'point_policies';
    protected $primaryKey = 'policy_id';
    public $incrementing = false;
    protected $keyType = 'string';

    // point_policies has created_at but no updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'policy_id',
        'participation_role',
        'default_points',
    ];

    protected $casts = [
        'default_points' => 'integer',
        'created_at'     => 'datetime',
    ];
}
