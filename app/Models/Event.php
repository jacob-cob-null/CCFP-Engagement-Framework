<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $table = 'events';
    protected $primaryKey = 'event_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'event_id',
        'title',
        'description',
        'scope',
        'activity_program',
        'term_id',
        'unit_id',
        'event_date',
        'created_by',
    ];

    protected $casts = [
        'event_date'  => 'date',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
        'deleted_at'  => 'datetime',
        'is_archived' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function term()
    {
        return $this->belongsTo(AcademicTerm::class, 'term_id', 'term_id');
    }

    public function unit()
    {
        return $this->belongsTo(OrganizationalUnit::class, 'unit_id', 'unit_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'event_id', 'event_id');
    }

    public function pointOverrides()
    {
        return $this->hasMany(EventPointOverride::class, 'event_id', 'event_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at')->where('is_archived', false);
    }
}
