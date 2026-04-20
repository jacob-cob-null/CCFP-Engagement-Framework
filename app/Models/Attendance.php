<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $table = 'attendance';
    protected $primaryKey = 'attendance_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'attendance_id',
        'employee_id',
        'event_id',
        'participation_role',
        'points_awarded',
        'recorded_by',
        'is_manual_override',
        'override_reason',
    ];

    protected $casts = [
        'points_awarded'     => 'integer',
        'is_manual_override' => 'boolean',
        'is_archived'        => 'boolean',
        'recorded_at'        => 'datetime',
        'created_at'         => 'datetime',
        'updated_at'         => 'datetime',
        'deleted_at'         => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id', 'event_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by', 'user_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at')->where('is_archived', false);
    }
}
