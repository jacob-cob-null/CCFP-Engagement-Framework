<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $primaryKey = 'employee_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['employee_number', 'employee_name', 'personnel_type', 'status', 'unit_id'];
}
