<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Event;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function employees(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        
        $query = Employee::with('unit')->whereNull('deleted_at');
        if (!$isAdmin) {
            $query->where('unit_id', $user->unit_id);
        }

        $employees = $query->orderBy('employee_name')->get();

        AuditService::log(
            actionType: 'data_export',
            targetId: null,
            description: "Exported current active employees list to CSV.",
            metadata: ['count' => $employees->count()],
        );

        return new StreamedResponse(function () use ($employees) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Employee Number', 'Name', 'Personnel Type', 'College/Unit', 'Status', 'Created At']);

            foreach ($employees as $emp) {
                fputcsv($handle, [
                    $emp->employee_number,
                    $emp->employee_name,
                    $emp->personnel_type,
                    $emp->unit ? $emp->unit->unit_name : $emp->unit_id,
                    $emp->status,
                    $emp->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="employees_export_'.date('YmdHis').'.csv"',
        ]);
    }

    public function attendance(Request $request, string $termId)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        $term = AcademicTerm::where('term_id', $termId)->firstOrFail();

        $query = Attendance::with(['employee.unit', 'event'])
            ->whereHas('event', function ($q) use ($termId) {
                $q->where('term_id', $termId);
            })
            ->whereNull('deleted_at');
            
        if (!$isAdmin) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }

        $records = $query->orderBy('recorded_at', 'desc')->get();

        AuditService::log(
            actionType: 'data_export',
            targetId: $termId,
            description: "Exported attendance records for {$term->academic_year} {$term->semester} to CSV.",
            metadata: ['count' => $records->count()],
        );

        return new StreamedResponse(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'Event Title', 'Event Scope', 'Employee Number', 'Employee Name', 'Unit', 'Role', 'Points Awarded', 'Recorded By (User ID)']);

            foreach ($records as $rec) {
                fputcsv($handle, [
                    $rec->recorded_at->format('Y-m-d H:i:s'),
                    $rec->event ? $rec->event->title : 'Unknown Event',
                    $rec->event ? $rec->event->scope : 'N/A',
                    $rec->employee ? $rec->employee->employee_number : 'N/A',
                    $rec->employee ? $rec->employee->employee_name : 'Unknown Employee',
                    ($rec->employee && $rec->employee->unit) ? $rec->employee->unit->unit_name : 'N/A',
                    $rec->participation_role,
                    $rec->points_awarded,
                    $rec->recorded_by,
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="attendance_export_'.$term->academic_year.'_'.$term->semester.'_'.date('YmdHis').'.csv"',
        ]);
    }

    public function eventAttendance(Request $request, string $eventId)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';

        $event = Event::with(['unit', 'term'])->where('event_id', $eventId)->active();

        if (!$isAdmin) {
            $event->where('unit_id', $user->unit_id);
        }

        $event = $event->firstOrFail();

        $query = Attendance::with(['employee.unit'])
            ->where('event_id', $eventId)
            ->whereNull('deleted_at');

        if (!$isAdmin) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }

        $records = $query->orderBy('recorded_at', 'desc')->get();

        AuditService::log(
            actionType: 'data_export',
            targetId: $eventId,
            description: "Exported attendance records for event '{$event->title}' to CSV.",
            metadata: ['count' => $records->count()],
        );

        $safeTitle = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $event->title);

        return new StreamedResponse(function () use ($records, $event) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Employee Number', 'Employee Name', 'Personnel Type', 'Unit', 'Role', 'Points Awarded', 'Override', 'Override Reason', 'Recorded At']);

            foreach ($records as $rec) {
                fputcsv($handle, [
                    $rec->employee ? $rec->employee->employee_number : 'N/A',
                    $rec->employee ? $rec->employee->employee_name : 'Unknown Employee',
                    $rec->employee ? $rec->employee->personnel_type : 'N/A',
                    ($rec->employee && $rec->employee->unit) ? $rec->employee->unit->unit_name : 'N/A',
                    $rec->participation_role,
                    $rec->points_awarded,
                    $rec->is_manual_override ? 'Yes' : 'No',
                    $rec->override_reason ?? '',
                    $rec->recorded_at->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="attendance_' . $safeTitle . '_' . date('YmdHis') . '.csv"',
        ]);
    }

    public function points(Request $request, string $termId)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        $term = AcademicTerm::where('term_id', $termId)->firstOrFail();

        $query = EmployeePointTotal::with(['employee.unit'])
            ->where('term_id', $termId)
            ->whereHas('employee', function ($q) {
                $q->whereNull('deleted_at');
            });

        if (!$isAdmin) {
             $query->whereHas('employee', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
             });
        }

        $records = $query->orderByDesc('total_points')->get();

        AuditService::log(
            actionType: 'data_export',
            targetId: $termId,
            description: "Exported point totals for {$term->academic_year} {$term->semester} to CSV.",
            metadata: ['count' => $records->count()],
        );

        return new StreamedResponse(function () use ($records) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Rank', 'Employee Number', 'Name', 'Personnel Type', 'College/Unit', 'Total Points', 'Last Calculated Active']);
            
            $rank = 1;
            foreach ($records as $rec) {
                fputcsv($handle, [
                    $rank++,
                    $rec->employee ? $rec->employee->employee_number : 'N/A',
                    $rec->employee ? $rec->employee->employee_name : 'Unknown Employee',
                    $rec->employee ? $rec->employee->personnel_type : 'N/A',
                    ($rec->employee && $rec->employee->unit) ? $rec->employee->unit->unit_name : 'N/A',
                    $rec->total_points,
                    $rec->last_calculated_at->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="point_leaderboard_'.$term->academic_year.'_'.$term->semester.'_'.date('YmdHis').'.csv"',
        ]);
    }
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        $unitId = $user->unit_id;

        $currentTerm = AcademicTerm::where('is_current', 'true')->first();
        $termId = $request->get('term_id', $currentTerm?->term_id);
        $term = $termId ? AcademicTerm::find($termId) : null;

        // Metrics
        $eQuery = Employee::active();
        $vQuery = Event::active();
        $aQuery = Attendance::active();

        if ($termId) {
            $vQuery->where('term_id', $termId);
            $aQuery->whereHas('event', function ($q) use ($termId) { $q->where('term_id', $termId); });
        }

        if (!$isAdmin) {
            $eQuery->where('unit_id', $unitId);
            $vQuery->where('unit_id', $unitId);
            $aQuery->whereHas('employee', function ($q) use ($unitId) { $q->where('unit_id', $unitId); });
        }

        $metrics = [
            'Total Employees' => $eQuery->count(),
            'Total Events' => $vQuery->count(),
            'Total Attendance' => $aQuery->count(),
            'Total Points' => (int) $aQuery->sum('points_awarded'),
        ];

        // Breakdowns - Personnel Type
        $byType = (clone $aQuery)
            ->join('employees', 'attendance.employee_id', '=', 'employees.employee_id')
            ->selectRaw('employees.personnel_type, count(*) as count')
            ->groupBy('employees.personnel_type')
            ->pluck('count', 'personnel_type')
            ->toArray();

        // Breakdowns - Event Scope
        $byScope = (clone $aQuery)
            ->join('events', 'attendance.event_id', '=', 'events.event_id')
            ->selectRaw('events.scope, count(*) as count')
            ->groupBy('events.scope')
            ->pluck('count', 'scope')
            ->toArray();

        AuditService::log(
            actionType: 'data_export',
            targetId: $termId,
            description: "Exported dashboard summary to CSV.",
            metadata: ['term' => $termId],
        );

        return new StreamedResponse(function () use ($metrics, $byType, $byScope, $term) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Dashboard Summary Export']);
            fputcsv($handle, ['Term', $term ? "{$term->academic_year} {$term->semester}" : 'All Terms']);
            fputcsv($handle, ['Exported At', date('Y-m-d H:i:s')]);
            fputcsv($handle, []);

            fputcsv($handle, ['Metric', 'Value']);
            foreach ($metrics as $label => $val) {
                fputcsv($handle, [$label, $val]);
            }
            fputcsv($handle, []);

            fputcsv($handle, ['Personnel Type Breakdown', 'Count']);
            fputcsv($handle, ['Teaching', $byType['teaching'] ?? 0]);
            fputcsv($handle, ['Non-Teaching', $byType['non_teaching'] ?? 0]);
            fputcsv($handle, []);

            fputcsv($handle, ['Event Scope Breakdown', 'Count']);
            fputcsv($handle, ['University', $byScope['university'] ?? 0]);
            fputcsv($handle, ['College', $byScope['college'] ?? 0]);
            fputcsv($handle, ['Organization', $byScope['organization'] ?? 0]);

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="dashboard_summary_'.date('YmdHis').'.csv"',
        ]);
    }

    public function events(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        
        $query = Event::with(['term', 'unit'])->whereNull('deleted_at');
        if (!$isAdmin) {
            $query->where('unit_id', $user->unit_id);
        }

        $events = $query->orderByDesc('event_date')->get();

        AuditService::log(
            actionType: 'data_export',
            targetId: null,
            description: "Exported events list to CSV.",
            metadata: ['count' => $events->count()],
        );

        return new StreamedResponse(function () use ($events) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Event ID', 'Title', 'Activity Program', 'Scope', 'Date', 'Term', 'Unit']);

            foreach ($events as $event) {
                fputcsv($handle, [
                    $event->event_id,
                    $event->title,
                    $event->activity_program,
                    $event->scope,
                    $event->event_date->format('Y-m-d'),
                    $event->term ? "{$event->term->academic_year} {$event->term->semester}" : 'N/A',
                    $event->unit ? $event->unit->unit_name : $event->unit_id,
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="events_export_'.date('YmdHis').'.csv"',
        ]);
    }

    public function auditLogs(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['ccfp_admin', 'college_rep'])) {
            abort(403);
        }

        $query = ActivityLog::with('user')->orderByDesc('created_at');

        if ($user->role === 'college_rep') {
            $childUnitIds      = \App\Models\OrganizationalUnit::where('parent_id', $user->unit_id)->pluck('unit_id');
            $accessibleUserIds = \App\Models\User::whereIn('unit_id', $childUnitIds)->pluck('user_id');
            $query->where(function ($q) use ($user, $accessibleUserIds) {
                $q->where('user_id', $user->user_id)
                  ->orWhereIn('user_id', $accessibleUserIds);
            });
        }

        $logs = $query->get();

        AuditService::log(
            actionType: 'data_export',
            targetId: null,
            description: "Exported audit logs to CSV.",
            metadata: ['count' => $logs->count()],
        );

        return new StreamedResponse(function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'User', 'Action Type', 'Target ID', 'Description', 'Metadata']);

            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->user ? $log->user->user_name : 'System',
                    $log->action_type,
                    $log->target_id,
                    $log->description,
                    json_encode($log->metadata),
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit_logs_export_'.date('YmdHis').'.csv"',
        ]);
    }
}
