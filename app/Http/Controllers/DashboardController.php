<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeePointTotal;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Lightweight query profiler (local only): listen to queries for
        // this request and write the heaviest ones to storage/logs/query_debug.json
        if (app()->environment('local')) {
            $queries = [];
            DB::listen(function ($query) use (&$queries) {
                $queries[] = [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'time' => $query->time,
                ];
            });
        }

        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        $unitId = $user->unit_id;

        $currentTerm = AcademicTerm::where('is_current', 'true')->first();
        $termId = $request->get('term_id', $currentTerm?->term_id);

        // Fetch terms for the dropdown (array to keep payload small)
        $terms = AcademicTerm::orderByDesc('start_date')->get(['term_id', 'academic_year', 'semester', 'is_current'])->toArray();

        // Base queries
        $employeeQuery = Employee::active();
        $eventQuery = Event::active();
        if ($termId) {
            $eventQuery->where('term_id', $termId);
        }

        if (!$isAdmin) {
            $employeeQuery->where('unit_id', $unitId);
            $eventQuery->where('unit_id', $unitId);
        }

        // Summary Metrics & Attendance
        $metricsClosure = function () use ($termId, $isAdmin, $unitId, $employeeQuery, $eventQuery) {
            $cacheKey = 'dashboard:metrics:' . ($termId ?? 'all') . ':' . ($isAdmin ? 'admin' : $unitId);
            $baseMetrics = Cache::remember($cacheKey, 30, function () use ($employeeQuery, $eventQuery) {
                return [
                    'total_employees' => (clone $employeeQuery)->count(),
                    'total_events' => (clone $eventQuery)->count(),
                ];
            });

            $attendanceCacheKey = 'dashboard:attendance:' . ($termId ?? 'all') . ':' . ($isAdmin ? 'admin' : $unitId);
            $attendanceMetrics = Cache::remember($attendanceCacheKey, 30, function () use ($termId, $isAdmin, $unitId) {
                $q = Attendance::active();
                if ($termId) {
                    $q->whereHas('event', function ($qq) use ($termId) { $qq->where('term_id', $termId); });
                }
                if (!$isAdmin) {
                    $q->whereHas('employee', function ($qq) use ($unitId) { $qq->where('unit_id', $unitId); });
                }

                $totalAttendance = (clone $q)->count();
                $totalPoints = (clone $q)->sum('points_awarded');

                return [
                    'total_attendance' => $totalAttendance,
                    'total_points' => (int) $totalPoints,
                ];
            });

            return [
                'total_employees' => $baseMetrics['total_employees'],
                'total_events' => $baseMetrics['total_events'],
                'total_attendance' => $attendanceMetrics['total_attendance'],
                'total_points' => $attendanceMetrics['total_points'],
            ];
        };

        $breakdownsClosure = function () use ($termId, $isAdmin, $unitId) {
            $attendanceCacheKey = 'dashboard:attendance_breakdowns:' . ($termId ?? 'all') . ':' . ($isAdmin ? 'admin' : $unitId);
            return Cache::remember($attendanceCacheKey, 30, function () use ($termId, $isAdmin, $unitId) {
                $q = Attendance::active();
                if ($termId) {
                    $q->whereHas('event', function ($qq) use ($termId) { $qq->where('term_id', $termId); });
                }
                if (!$isAdmin) {
                    $q->whereHas('employee', function ($qq) use ($unitId) { $qq->where('unit_id', $unitId); });
                }

                $byType = (clone $q)
                    ->join('employees', 'attendance.employee_id', '=', 'employees.employee_id')
                    ->selectRaw('employees.personnel_type, count(*) as count')
                    ->groupBy('employees.personnel_type')
                    ->pluck('count', 'personnel_type')
                    ->toArray();

                $byScope = (clone $q)
                    ->join('events', 'attendance.event_id', '=', 'events.event_id')
                    ->selectRaw('events.scope, count(*) as count')
                    ->groupBy('events.scope')
                    ->pluck('count', 'scope')
                    ->toArray();

                return [
                    'personnel_type' => [
                        'teaching' => $byType['teaching'] ?? 0,
                        'non_teaching' => $byType['non_teaching'] ?? 0,
                    ],
                    'event_scope' => [
                        'university' => $byScope['university'] ?? 0,
                        'college' => $byScope['college'] ?? 0,
                        'organization' => $byScope['organization'] ?? 0,
                    ],
                ];
            });
        };

        $topEmployeesClosure = function () use ($termId, $isAdmin, $unitId) {
            $leaderboardQuery = EmployeePointTotal::with(['employee.unit'])
                ->whereHas('employee', function ($q) {
                    $q->whereNull('deleted_at');
                });

            if ($termId) {
                $leaderboardQuery->where('term_id', $termId);
            }
            if (!$isAdmin) {
                $leaderboardQuery->whereHas('employee', function ($q) use ($unitId) {
                    $q->where('unit_id', $unitId);
                });
            }

            $topEmployeesCacheKey = 'dashboard:topEmployees:' . ($termId ?? 'all') . ':' . ($isAdmin ? 'admin' : $unitId);
            return Cache::remember($topEmployeesCacheKey, 30, function () use ($leaderboardQuery) {
                $rows = $leaderboardQuery->orderByDesc('total_points')->take(5)->get();
                return $rows->map(function ($r) {
                    $emp = $r->employee;
                    return [
                        'employee_id' => $r->employee_id,
                        'total_points' => (int) $r->total_points,
                        'employee' => $emp ? [
                            'employee_name' => $emp->employee_name,
                            'employee_number' => $emp->employee_number,
                            'personnel_type' => $emp->personnel_type,
                            'unit' => $emp->unit ? [
                                'unit_name' => $emp->unit->unit_name,
                                'unit_id' => $emp->unit_id,
                            ] : null,
                        ] : null,
                    ];
                })->toArray();
            });
        };

        return Inertia::render('dashboard', [
            'terms' => $terms,
            'selectedTermId' => $termId,
            'metrics' => Inertia::defer($metricsClosure),
            'breakdowns' => Inertia::defer($breakdownsClosure),
            'topEmployees' => Inertia::defer($topEmployeesClosure),
        ]);
    }
}
