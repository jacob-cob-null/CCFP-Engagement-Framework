<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

// ─── Authenticated routes ────────────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {

    // Static placeholder pages
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('events/setup', 'events/setup')->name('events.setup');
    Route::inertia('attendance', 'attendance')->name('attendance');
    Route::inertia('employee', 'employee')->name('employee');
    Route::inertia('statistics', 'statistics')->name('statistics');

    // ── User Management (admin only) ─────────────────────────────────────────
    Route::middleware([EnsureIsAdmin::class])->group(function () {
        Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('users', [AdminUserController::class, 'store'])->name('users.store');
        Route::patch('users/{id}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('users/{id}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    });
});

require __DIR__.'/settings.php';
