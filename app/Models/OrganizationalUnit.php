<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

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
        'parent_id',
    ];

    protected $casts = [
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
        'deleted_at'  => 'datetime',
        'is_archived' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function parent()
    {
        return $this->belongsTo(OrganizationalUnit::class, 'parent_id', 'unit_id');
    }

    public function children()
    {
        return $this->hasMany(OrganizationalUnit::class, 'parent_id', 'unit_id');
    }

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

    /**
     * Restrict results to units visible to the authenticated user.
     * ccfp_admin sees all units. Other roles see their own unit and all
     * descendants, as determined by the database hierarchy function.
     */
    public function scopeVisible($query)
    {
        $user = Auth::user();

        if (!$user || $user->role === 'ccfp_admin') {
            return $query;
        }

        return $query->whereRaw(
            '"organizational_units"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
            [$user->user_id]
        );
    }
}
