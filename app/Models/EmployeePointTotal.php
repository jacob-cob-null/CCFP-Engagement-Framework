<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeePointTotal extends Model
{
    protected $table = 'employee_point_totals';
    // Composite PK — Eloquent doesn't support this natively, disable PK auto-handling
    public $incrementing = false;
    protected $primaryKey = null;
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'term_id',
        'total_points',
        'last_calculated_at',
    ];

    protected $casts = [
        'total_points'       => 'integer',
        'last_calculated_at' => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function term()
    {
        return $this->belongsTo(AcademicTerm::class, 'term_id', 'term_id');
    }
}
