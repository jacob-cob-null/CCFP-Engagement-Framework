<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeePointTotal;
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
}
