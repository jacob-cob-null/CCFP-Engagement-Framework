<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationalUnit extends Model
{
    protected $table = 'organizational_units';
    protected $primaryKey = 'unit_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'unit_id',
        'unit_name',
        'unit_type',
    ];

    protected $casts = [
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
        'deleted_at'  => 'datetime',
        'is_archived' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function employees()
    {
        return $this->hasMany(Employee::class, 'unit_id', 'unit_id');
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'unit_id', 'unit_id');
    }

    public function profiles()
    {
        return $this->hasMany(User::class, 'unit_id', 'unit_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->whereNull($this->getTable() . '.deleted_at')->whereRaw('"' . $this->getTable() . '"."is_archived" = false');
    }
}
