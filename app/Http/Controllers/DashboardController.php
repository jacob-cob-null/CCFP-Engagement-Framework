<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeePointTotal;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Summary Metrics
        $totalEmployees = (clone $employeeQuery)->count();
        $totalEvents = current($eventQuery->pluck('event_id')->toArray()) ? (clone $eventQuery)->count() : 0; // optimized check
        $totalEvents = (clone $eventQuery)->count();

        $attendanceQuery = Attendance::active();
        if ($termId) {
            $attendanceQuery->whereHas('event', function ($q) use ($termId) {
                $q->where('term_id', $termId);
            });
        }
        if (!$isAdmin) {
            $attendanceQuery->whereHas('employee', function ($q) use ($unitId) {
                $q->where('unit_id', $unitId);
            });
        }
        $totalAttendance = (clone $attendanceQuery)->count();
        $totalPoints = (clone $attendanceQuery)->sum('points_awarded');

        // Attendance Breakdown by Personnel Type
        $attendanceByTypeQuery = (clone $attendanceQuery)
            ->join('employees', 'attendance.employee_id', '=', 'employees.employee_id')
            ->selectRaw('employees.personnel_type, count(*) as count')
            ->groupBy('employees.personnel_type')
            ->pluck('count', 'personnel_type')
            ->toArray();

        // Attendance Breakdown by Event Scope
        $attendanceByScopeQuery = (clone $attendanceQuery)
            ->join('events', 'attendance.event_id', '=', 'events.event_id')
            ->selectRaw('events.scope, count(*) as count')
            ->groupBy('events.scope')
            ->pluck('count', 'scope')
            ->toArray();


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

        $topEmployees = $leaderboardQuery->orderByDesc('total_points')
            ->take(5)
            ->get();

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
