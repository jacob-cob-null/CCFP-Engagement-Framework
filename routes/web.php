<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AcademicTermController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\LiveAttendanceController;
use App\Http\Controllers\OrganizationalUnitController;
use App\Http\Controllers\PointPolicyController;
use App\Http\Controllers\SemesterArchiveController;
use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

// ─── Authenticated routes ────────────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {

    // Dashboard
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // ── Employee Management ──────────────────────────────────────────────────
    Route::get('employee', [EmployeeController::class, 'index'])->name('employee.index');
    Route::post('employee', [EmployeeController::class, 'store'])->name('employee.store');
    Route::patch('employee/{id}', [EmployeeController::class, 'update'])->name('employee.update');
    Route::delete('employee/{id}', [EmployeeController::class, 'destroy'])->name('employee.destroy');

    // ── Points Leaderboard ───────────────────────────────────────────────────
    Route::get('employee-points', [\App\Http\Controllers\EmployeePointsController::class, 'index'])->name('employee-points.index');

    // ── Data Export ──────────────────────────────────────────────────────────
    Route::get('export/dashboard', [\App\Http\Controllers\ExportController::class, 'dashboard'])->name('export.dashboard');
    Route::get('export/employees', [\App\Http\Controllers\ExportController::class, 'employees'])->name('export.employees');
    Route::get('export/events', [\App\Http\Controllers\ExportController::class, 'events'])->name('export.events');
    Route::get('export/attendance/event/{eventId}', [\App\Http\Controllers\ExportController::class, 'eventAttendance'])->name('export.eventAttendance');
    Route::get('export/attendance/{termId}', [\App\Http\Controllers\ExportController::class, 'attendance'])->name('export.attendance');
    Route::get('export/points/{termId}', [\App\Http\Controllers\ExportController::class, 'points'])->name('export.points');

    // ── Events ───────────────────────────────────────────────────────────────
    Route::get('events/setup', [EventController::class, 'index'])->name('events.setup');
    Route::post('events', [EventController::class, 'store'])->name('events.store');
    Route::patch('events/{id}', [EventController::class, 'update'])->name('events.update');
    Route::delete('events/{id}', [EventController::class, 'destroy'])->name('events.destroy');

    // ── Attendance ───────────────────────────────────────────────────────────
    Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
    Route::patch('attendance/{id}', [AttendanceController::class, 'update'])->name('attendance.update');
    Route::delete('attendance/{id}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
    
    Route::get('api/attendance/employees', [AttendanceController::class, 'getEmployees'])->name('api.attendance.employees');
    Route::post('api/attendance/record', [AttendanceController::class, 'recordAttendance'])->name('api.attendance.record');

    // ── Live / Mobile Attendance ─────────────────────────────────────────────
    Route::get('attendance/live', [LiveAttendanceController::class, 'index'])->name('attendance.live');
    Route::post('attendance/live', [LiveAttendanceController::class, 'store'])->name('attendance.live.store');

    // ── Admin-only routes ────────────────────────────────────────────────────
    Route::middleware([EnsureIsAdmin::class])->group(function () {

        // Academic Terms
        Route::get('academic-terms', [AcademicTermController::class, 'index'])->name('academic-terms.index');
        Route::post('academic-terms', [AcademicTermController::class, 'store'])->name('academic-terms.store');
        Route::patch('academic-terms/{id}', [AcademicTermController::class, 'update'])->name('academic-terms.update');
        Route::delete('academic-terms/{id}', [AcademicTermController::class, 'destroy'])->name('academic-terms.destroy');

        // Organizational Units
        Route::get('organizational-units', [OrganizationalUnitController::class, 'index'])->name('organizational-units.index');
        Route::post('organizational-units', [OrganizationalUnitController::class, 'store'])->name('organizational-units.store');
        Route::patch('organizational-units/{id}', [OrganizationalUnitController::class, 'update'])->name('organizational-units.update');
        Route::delete('organizational-units/{id}', [OrganizationalUnitController::class, 'destroy'])->name('organizational-units.destroy');

        // Point Policies
        Route::get('point-policies', [PointPolicyController::class, 'index'])->name('point-policies.index');
        Route::post('point-policies', [PointPolicyController::class, 'store'])->name('point-policies.store');
        Route::patch('point-policies/{id}', [PointPolicyController::class, 'update'])->name('point-policies.update');
        Route::delete('point-policies/{id}', [PointPolicyController::class, 'destroy'])->name('point-policies.destroy');

        // User Management
        Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('users', [AdminUserController::class, 'store'])->name('users.store');
        Route::patch('users/{id}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('users/{id}', [AdminUserController::class, 'destroy'])->name('users.destroy');

        // Semester Archiving
        Route::get('semester-archive', [SemesterArchiveController::class, 'index'])->name('semester-archive.index');
        Route::post('semester-archive/{termId}', [SemesterArchiveController::class, 'archive'])->name('semester-archive.archive');

    });

    // Audit Logs — accessible to ccfp_admin and college_rep (scoped per role)
    Route::get('audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('export/audit-logs', [\App\Http\Controllers\ExportController::class, 'auditLogs'])->name('export.auditLogs');
});

require __DIR__.'/settings.php';
