<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationalUnit extends Model
{
    protected $primaryKey = 'unit_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['unit_name', 'unit_type'];
}
