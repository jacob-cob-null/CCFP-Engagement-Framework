<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::redirect('/', '/login')->name('home');

Route::inertia('dashboard', 'dashboard')->name('dashboard');
Route::inertia('events/setup', 'events/setup')->name('events.setup');
Route::inertia('attendance', 'attendance')->name('attendance');
Route::inertia('employee', 'employee')->name('employee');
Route::inertia('statistics', 'statistics')->name('statistics');

require __DIR__.'/settings.php';
