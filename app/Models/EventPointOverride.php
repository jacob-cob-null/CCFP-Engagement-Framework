<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventPointOverride extends Model
{
    protected $table = 'event_point_overrides';
    protected $primaryKey = 'override_id';
    public $incrementing = false;
    protected $keyType = 'string';

    const UPDATED_AT = null;

    protected $fillable = [
        'override_id',
        'event_id',
        'participation_role',
        'points_awarded',
    ];

    protected $casts = [
        'points_awarded' => 'integer',
        'created_at'     => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id', 'event_id');
    }
}
