<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $table = 'employees';
    protected $primaryKey = 'employee_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'employee_id',
        'employee_number',
        'employee_name',
        'personnel_type',
        'status',
        'unit_id',
    ];

    protected $casts = [
        'employee_number' => 'integer',
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
        'deleted_at'      => 'datetime',
        'is_archived'     => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function unit()
    {
        return $this->belongsTo(OrganizationalUnit::class, 'unit_id', 'unit_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'employee_id', 'employee_id');
    }

    public function pointTotals()
    {
        return $this->hasMany(EmployeePointTotal::class, 'employee_id', 'employee_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where($this->getTable() . '.status', 'active')->whereNull($this->getTable() . '.deleted_at');
    }
}
