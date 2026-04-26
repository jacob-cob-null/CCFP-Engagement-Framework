<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Event;
use App\Models\PointPolicy;
use App\Services\AuditService;
use App\Services\CacheKeys;
use App\Services\PointCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with('unit')->active();

        $user = Auth::user();
        if ($user->role !== 'ccfp_admin') {
            $query->where('unit_id', $user->unit_id);
        }

        $events = $query->orderByDesc('event_date')->get(['event_id', 'title', 'event_date', 'scope', 'unit_id', 'term_id']);

        $attendanceRecords = collect();
        $selectedEvent     = null;
        $recentRecords     = collect();
        $totalCount        = 0;

        if ($eventId = $request->get('event_id')) {
            $selectedEvent = Event::with('unit', 'term')->where('event_id', $eventId)->active()->first();

            if ($selectedEvent) {
                $attendanceRecords = Attendance::with('employee')
                    ->where('event_id', $eventId)
                    ->active()
                    ->orderBy('recorded_at', 'desc')
                    ->get();

                // Recent records and total count to support quick/live checks on the main page
                $recentRecords = Attendance::with('employee')
                    ->where('event_id', $eventId)
                    ->active()
                    ->orderBy('recorded_at', 'desc')
                    ->limit(5)
                    ->get();

                $totalCount = Attendance::where('event_id', $eventId)->active()->count();
            }
        }

        // Point policies from cache — used for display in modal
        $policies = Cache::remember(CacheKeys::POINT_POLICIES, CacheKeys::TTL_STABLE, fn() =>
            PointPolicy::orderBy('participation_role')->get()->toArray()
        );

        return Inertia::render('attendance', [
            'events'            => $events,
            'selectedEvent'     => $selectedEvent,
            'attendanceRecords' => $attendanceRecords,
            'pointPolicies'     => $policies,
            'recentRecords'     => $recentRecords,
            'totalCount'        => $totalCount,
            'filters'           => $request->only(['event_id']),
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

        $employee = Employee::where('employee_name', 'ilike', $validated['search_query'])
            ->orWhere('employee_number', $validated['search_query'])
            ->whereNull('deleted_at')
            ->first();

        if (!$employee) {
            return back()->withErrors(['search_query' => 'No active employee found with that name or number.']);
        }

        $existing = Attendance::where('event_id', $event->event_id)
            ->where('employee_id', $employee->employee_id)
            ->active()
            ->first();

        if ($existing) {
            return back()->withErrors(['search_query' => "{$employee->employee_name} is already recorded for this event."]);
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
            actionType:  'create_attendance',
            targetId:    $attendance->attendance_id,
            description: "Recorded attendance for {$employee->employee_name} at event '{$event->title}' ({$validated['participation_role']}, {$pointsAwarded} pts).",
            metadata:    [
                'employee_id'        => $employee->employee_id,
                'event_id'           => $event->event_id,
                'participation_role' => $validated['participation_role'],
                'points_awarded'     => $pointsAwarded,
            ],
        );

        return redirect()->route('attendance.index', ['event_id' => $event->event_id])
            ->with('success', "{$employee->employee_name} recorded ({$pointsAwarded} pts).");
    }

    public function update(Request $request, string $id)
    {
        $record = Attendance::where('attendance_id', $id)->active()->firstOrFail();

        $validated = $request->validate([
            'points_awarded'     => 'required|integer|min:0',
            'participation_role' => 'required|in:participant,organizer,donor',
            'override_reason'    => 'required|string|max:500',
        ]);

        $before = $record->only(['points_awarded', 'participation_role']);
        $record->update([
            'points_awarded'     => $validated['points_awarded'],
            'participation_role' => $validated['participation_role'],
            'override_reason'    => $validated['override_reason'],
            'is_manual_override' => true,
        ]);

        $event = Event::find($record->event_id);
        if ($event) {
            PointCalculationService::recalculateTotal($record->employee_id, $event->term_id);
        }

        AuditService::log(
            actionType:  'update_attendance',
            targetId:    $id,
            description: "Manual point override for attendance {$id}: {$before['points_awarded']} → {$validated['points_awarded']} pts. Reason: {$validated['override_reason']}",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('attendance.index', ['event_id' => $record->event_id])
            ->with('success', 'Attendance record updated.');
    }

    public function destroy(string $id)
    {
        $record = Attendance::where('attendance_id', $id)->active()->firstOrFail();

        $record->update([
            'deleted_at'  => now(),
            'is_archived' => true,
        ]);

        $event = Event::find($record->event_id);
        if ($event) {
            PointCalculationService::recalculateTotal($record->employee_id, $event->term_id);
        }

        AuditService::log(
            actionType:  'delete_attendance',
            targetId:    $id,
            description: "Soft-deleted attendance record {$id}.",
            metadata:    [
                'employee_id' => $record->employee_id,
                'event_id'    => $record->event_id,
            ],
        );

        return redirect()->route('attendance.index', ['event_id' => $record->event_id])
            ->with('success', 'Attendance record removed.');
    }

}
