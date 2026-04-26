<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\Attendance;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Admin-only semester archiving controller.
 *
 * Business rule: "Raw attendance logs will undergo a soft deletion at the
 * end of each semester to clear the active user interface. The semester
 * soft deletion process must NOT erase or reset the annual accumulated
 * point totals."
 *
 * This controller bulk soft-deletes attendance records for a given term while
 * intentionally leaving employee_point_totals untouched.
 */
class SemesterArchiveController extends Controller
{
    public function index()
    {
        // Load each term with counts of active + archived attendance records
        $terms = Inertia::defer(fn() => AcademicTerm::orderByDesc('start_date')
            ->get()
            ->map(function (AcademicTerm $term) {
                // Count attendance records linked to this term's events
                $activeCount = Attendance::whereHas('event', fn($q) =>
                    $q->where('term_id', $term->term_id)
                )
                ->whereNull('deleted_at')
                ->whereRaw('"is_archived" = false')
                ->count();

                $archivedCount = Attendance::whereHas('event', fn($q) =>
                    $q->where('term_id', $term->term_id)
                )
                ->whereRaw('"is_archived" = true')
                ->count();

                return [
                    'term_id'        => $term->term_id,
                    'academic_year'  => $term->academic_year,
                    'semester'       => $term->semester,
                    'start_date'     => $term->start_date,
                    'end_date'       => $term->end_date,
                    'is_current'     => $term->is_current,
                    'active_count'   => $activeCount,
                    'archived_count' => $archivedCount,
                ];
            }));

        return Inertia::render('admin/semester-archive', [
            'terms' => $terms,
        ]);
    }

    public function archive(Request $request, string $termId)
    {
        $term = AcademicTerm::where('term_id', $termId)->firstOrFail();

        // Collect IDs of all active attendance records for this term's events
        $attendanceIds = Attendance::whereHas('event', fn($q) =>
                $q->where('term_id', $termId)
            )
            ->whereNull('deleted_at')
            ->whereRaw('"is_archived" = false')
            ->pluck('attendance_id');

        $count = $attendanceIds->count();

        if ($count === 0) {
            return back()->with('info', 'No active attendance records to archive for this term.');
        }

        // Bulk soft-delete: set deleted_at + is_archived
        // employee_point_totals is intentionally NOT touched here.
        Attendance::whereIn('attendance_id', $attendanceIds)
            ->update([
                'deleted_at'  => now(),
                'is_archived' => true,
                'updated_at'  => now(),
            ]);

        AuditService::log(
            actionType:  'semester_archive',
            targetId:    $termId,
            description: "Archived {$count} attendance record(s) for term: {$term->academic_year} {$term->semester} semester.",
            metadata:    [
                'term_id'         => $termId,
                'academic_year'   => $term->academic_year,
                'semester'        => $term->semester,
                'archived_count'  => $count,
            ],
        );

        return redirect()->route('semester-archive.index')
            ->with('success', "Archived {$count} attendance record(s) for {$term->academic_year} {$term->semester} semester. Point totals are preserved.");
    }
}
