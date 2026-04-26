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
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        $unitId = $user->unit_id;

        $currentTerm = AcademicTerm::where('is_current', 'true')->first();
        $termId = $request->get('term_id', $currentTerm?->term_id);

        // Fetch terms for the dropdown
        $terms = AcademicTerm::orderByDesc('start_date')->get(['term_id', 'academic_year', 'semester', 'is_current']);

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
            return $leaderboardQuery->orderByDesc('total_points')->take(5)->get();
        });

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
