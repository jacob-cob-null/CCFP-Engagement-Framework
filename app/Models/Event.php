<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $primaryKey = 'event_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['title', 'description', 'scope', 'activity_program', 'term_id', 'unit_id', 'event_date', 'created_by'];
}
