<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Event;
use App\Services\AuditService;
use App\Services\CacheKeys;
use App\Services\PointCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Mobile / live attendance controller.
 *
 * Serves a minimal, phone-optimised Inertia page at /attendance/live.
 * Uses the same PointCalculationService as the desktop AttendanceController
 * to guarantee identical point awards on both recording paths.
 */
class LiveAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user   = Auth::user();
        $query  = Event::with('unit')->active();

        if ($user->role !== 'ccfp_admin') {
            $query->where('unit_id', $user->unit_id);
        }

        $events = $query->orderByDesc('event_date')
            ->get(['event_id', 'title', 'event_date', 'scope', 'unit_id', 'term_id']);

        $selectedEvent   = null;
        $recentRecords   = collect();
        $totalCount      = 0;

        if ($eventId = $request->get('event_id')) {
            $selectedEvent = Event::with('unit', 'term')
                ->where('event_id', $eventId)
                ->active()
                ->first();

            if ($selectedEvent) {
                // Last 5 records for quick on-site feedback
                $recentRecords = Attendance::with('employee')
                    ->where('event_id', $eventId)
                    ->active()
                    ->orderBy('recorded_at', 'desc')
                    ->limit(5)
                    ->get();

                $totalCount = Attendance::where('event_id', $eventId)->active()->count();
            }
        }

        return Inertia::render('attendance/live', [
            'events'        => $events,
            'selectedEvent' => $selectedEvent,
            'recentRecords' => $recentRecords,
            'totalCount'    => $totalCount,
            'filters'       => $request->only(['event_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id'           => 'required|exists:events,event_id',
            'search_query'       => 'required|string',
            'participation_role' => 'required|in:participant,organizer,donor',
        ]);

        $event = Event::where('event_id', $validated['event_id'])->active()->firstOrFail();

        // Resolve employee by name (ilike) or exact employee number
        $employee = Employee::where('employee_name', 'ilike', $validated['search_query'])
            ->orWhere('employee_number', $validated['search_query'])
            ->whereNull('deleted_at')
            ->first();

        if (!$employee) {
            return back()->withErrors([
                'search_query' => 'No active employee found with that name or number.',
            ]);
        }

        // Duplicate-guard
        $existing = Attendance::where('event_id', $event->event_id)
            ->where('employee_id', $employee->employee_id)
            ->active()
            ->first();

        if ($existing) {
            return back()->withErrors([
                'search_query' => "{$employee->employee_name} is already recorded for this event.",
            ]);
        }

        $pointsAwarded = PointCalculationService::calculatePoints($event, $validated['participation_role']);

        $attendance = Attendance::create([
            'attendance_id'      => (string) Str::uuid(),
            'employee_id'        => $employee->employee_id,
            'event_id'           => $event->event_id,
            'participation_role' => $validated['participation_role'],
            'points_awarded'     => $pointsAwarded,
            'recorded_by'        => Auth::user()->user_id,
        ]);

        PointCalculationService::recalculateTotal($employee->employee_id, $event->term_id);

        AuditService::log(
            actionType:  'attendance_recorded',
            targetId:    $attendance->attendance_id,
            description: "Live: recorded {$employee->employee_name} at '{$event->title}' ({$validated['participation_role']}, {$pointsAwarded} pts).",
            metadata:    [
                'employee_id'        => $employee->employee_id,
                'event_id'           => $event->event_id,
                'participation_role' => $validated['participation_role'],
                'points_awarded'     => $pointsAwarded,
                'via'                => 'mobile_live',
            ],
        );

        return redirect()
            ->route('attendance.live', ['event_id' => $event->event_id])
            ->with('success', "✓ {$employee->employee_name} — {$pointsAwarded} pt" . ($pointsAwarded !== 1 ? 's' : ''));
    }
}
