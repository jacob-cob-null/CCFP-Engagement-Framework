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

        // Summary Metrics (cache briefly to speed navigation)
        $cacheKey = 'dashboard:metrics:' . ($termId ?? 'all') . ':' . ($isAdmin ? 'admin' : $unitId);
        $metrics = Cache::remember($cacheKey, 30, function () use ($employeeQuery, $eventQuery) {
            $totalEmployees = (clone $employeeQuery)->count();
            $totalEvents = (clone $eventQuery)->count();

            return [
                'total_employees' => $totalEmployees,
                'total_events' => $totalEvents,
            ];
        });

        $totalEmployees = $metrics['total_employees'];
        $totalEvents = $metrics['total_events'];

        // Attendance queries are relatively expensive; cache results briefly
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
                'total_attendance' => $totalAttendance,
                'total_points' => (int) $totalPoints,
                'by_type' => $byType,
                'by_scope' => $byScope,
            ];
        });

        $totalAttendance = $attendanceMetrics['total_attendance'];
        $totalPoints = $attendanceMetrics['total_points'];
        $attendanceByTypeQuery = $attendanceMetrics['by_type'];
        $attendanceByScopeQuery = $attendanceMetrics['by_scope'];


        // Leaderboard snippet
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
        $topEmployees = Cache::remember($topEmployeesCacheKey, 30, function () use ($leaderboardQuery) {
            $rows = $leaderboardQuery->orderByDesc('total_points')->take(5)->get();
            return $rows->map(function ($r) {
                $emp = $r->employee;
                return [
                    'employee_id' => $emp->employee_id ?? null,
                    'employee_name' => $emp->employee_name ?? null,
                    'unit_id' => $emp->unit_id ?? null,
                    'unit_name' => $emp->unit->unit_name ?? null,
                    'total_points' => (int) $r->total_points,
                ];
            })->toArray();
        });

        // If profiling was enabled above, write query summary to a debug file
        if (app()->environment('local') && isset($queries)) {
            try {
                usort($queries, fn($a, $b) => $b['time'] <=> $a['time']);
                $summary = array_slice($queries, 0, 25);
                $path = storage_path('logs/query_debug.json');
                file_put_contents($path, json_encode(['generated_at' => now()->toDateTimeString(), 'queries' => $summary], JSON_PRETTY_PRINT));
            } catch (\Throwable $e) {
                Log::warning('Failed to write query debug file: ' . $e->getMessage());
            }
        }

        return Inertia::render('dashboard', [
            'terms' => $terms,
            'selectedTermId' => $termId,
            'metrics' => [
                'total_employees' => $totalEmployees,
                'total_events' => $totalEvents,
                'total_attendance' => $totalAttendance,
                'total_points' => (int) $totalPoints,
            ],
            'breakdowns' => [
                'personnel_type' => [
                    'teaching' => $attendanceByTypeQuery['teaching'] ?? 0,
                    'non_teaching' => $attendanceByTypeQuery['non-teaching'] ?? 0,
                ],
                'event_scope' => [
                    'university' => $attendanceByScopeQuery['university'] ?? 0,
                    'college' => $attendanceByScopeQuery['college'] ?? 0,
                    'organization' => $attendanceByScopeQuery['organization'] ?? 0,
                ],
            ],
            'topEmployees' => $topEmployees,
        ]);
    }
}
