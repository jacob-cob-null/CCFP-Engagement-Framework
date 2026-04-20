<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicTerm extends Model
{
    protected $table = 'academic_terms';
    protected $primaryKey = 'term_id';
    public $incrementing = false;
    protected $keyType = 'string'; // date PK stored as string

    // academic_terms has created_at but no updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'term_id',
        'academic_year',
        'semester',
        'start_date',
        'end_date',
        'is_current',
    ];

    protected $casts = [
        'is_current'  => 'boolean',
        'start_date'  => 'date',
        'end_date'    => 'date',
        'created_at'  => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function events()
    {
        return $this->hasMany(Event::class, 'term_id', 'term_id');
    }

    public function pointTotals()
    {
        return $this->hasMany(EmployeePointTotal::class, 'term_id', 'term_id');
    }
}
