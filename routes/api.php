<?php

use App\Http\Controllers\AdminUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware(['auth:api', 'supabase.rls']);

Route::get('/events', function () {
    return \App\Models\Event::all();
})->middleware(['auth:api', 'supabase.rls']);

Route::post('/admin/users', [AdminUserController::class, 'store'])
    ->middleware(['auth:api', 'supabase.rls', 'admin']);
