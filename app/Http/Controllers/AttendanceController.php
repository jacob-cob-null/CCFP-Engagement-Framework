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
        $user = Auth::user();
        $selectedEvent = null;
        $attendanceRecords = null;
        $recentRecords = collect();
        $totalCount = 0;

        if ($eventId = $request->get('event_id')) {
            $selectedEvent = Event::with(['unit', 'term', 'pointOverrides'])->where('event_id', $eventId)->active();
            
            if ($user->role !== 'ccfp_admin') {
                $selectedEvent->whereRaw(
                    '"events"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                    [$user->user_id]
                );
            }
            
            $selectedEvent = $selectedEvent->first();

            if ($selectedEvent) {
                $attendanceRecords = Inertia::defer(fn() => Attendance::with('employee')
                    ->where('event_id', $eventId)
                    ->active()
                    ->orderBy('recorded_at', 'desc')
                    ->paginate(10)
                    ->withQueryString());

                $recentRecords = Inertia::defer(fn() => Attendance::with('employee')
                    ->where('event_id', $eventId)
                    ->active()
                    ->orderBy('recorded_at', 'desc')
                    ->limit(5)
                    ->get());

                $totalCount = Inertia::defer(fn() => Attendance::where('event_id', $eventId)->active()->count());
            }
        }

        $policies = Cache::remember(CacheKeys::POINT_POLICIES, CacheKeys::TTL_STABLE, fn() =>
            PointPolicy::orderBy('participation_role')->get()->toArray()
        );

        return Inertia::render('attendance', [
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

        $employeeQuery = Employee::where(function ($q) use ($validated) {
            $q->where('employee_name', 'ilike', $validated['search_query'])
              ->orWhere('employee_number', $validated['search_query']);
        })->active();

        if (Auth::user()->role !== 'ccfp_admin') {
            $employeeQuery->whereRaw(
                '"employees"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                [Auth::user()->user_id]
            );
        }

        $employee = $employeeQuery->first();

        if (!$employee) {
            return back()->withErrors(['search_query' => 'No active employee found within your unit with that name or number.']);
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
            actionType:  'attendance_recorded',
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
        $record = Attendance::where('attendance_id', $id)->active()
            ->when(Auth::user()->role !== 'ccfp_admin', function ($q) {
                $q->whereHas('event', fn($eq) => $eq->whereRaw(
                    '"events"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                    [Auth::user()->user_id]
                ));
            })
            ->firstOrFail();

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
            actionType:  'attendance_edited',
            targetId:    $id,
            description: "Manual point override for attendance {$id}: {$before['points_awarded']} → {$validated['points_awarded']} pts. Reason: {$validated['override_reason']}",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('attendance.index', ['event_id' => $record->event_id])
            ->with('success', 'Attendance record updated.');
    }

    public function destroy(string $id)
    {
        $record = Attendance::where('attendance_id', $id)->active()
            ->when(Auth::user()->role !== 'ccfp_admin', function ($q) {
                $q->whereHas('event', fn($eq) => $eq->whereRaw(
                    '"events"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                    [Auth::user()->user_id]
                ));
            })
            ->firstOrFail();

        $record->update([
            'deleted_at'  => now(),
            'is_archived' => true,
        ]);

        $event = Event::find($record->event_id);
        if ($event) {
            PointCalculationService::recalculateTotal($record->employee_id, $event->term_id);
        }

        AuditService::log(
            actionType:  'attendance_deleted',
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

    public function getEmployees(Request $request)
    {
        $query = Employee::active();

        if (Auth::user()->role !== 'ccfp_admin') {
            $query->whereRaw(
                '"employees"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                [Auth::user()->user_id]
            );
        } elseif ($orgId = $request->get('org_id')) {
            $query->where('unit_id', $orgId);
        }

        $employees = $query->orderBy('employee_name')
            ->get(['employee_id', 'employee_name', 'employee_number', 'personnel_type', 'unit_id']);

        return response()->json($employees);
    }

    public function recordAttendance(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'event_id'    => 'required|exists:events,event_id',
            'role'        => 'required|in:participant,organizer,donor',
        ]);

        $event = Event::where('event_id', $validated['event_id'])->active();
        if (Auth::user()->role !== 'ccfp_admin') {
            $event->whereRaw(
                '"events"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                [Auth::user()->user_id]
            );
        }
        $event = $event->firstOrFail();

        $employee = Employee::where('employee_id', $validated['employee_id'])->active();
        if (Auth::user()->role !== 'ccfp_admin') {
            $employee->whereRaw(
                '"employees"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                [Auth::user()->user_id]
            );
        }
        $employee = $employee->firstOrFail();

        $existing = Attendance::where('event_id', $event->event_id)
            ->where('employee_id', $employee->employee_id)
            ->active()
            ->first();

        if ($existing) {
            return back()->withErrors([
                'employee_id' => "{$employee->employee_name} is already recorded for this event."
            ]);
        }

        $pointsAwarded = PointCalculationService::calculatePoints($event, $validated['role']);

        $attendance = Attendance::create([
            'attendance_id'      => (string) Str::uuid(),
            'employee_id'        => $employee->employee_id,
            'event_id'           => $event->event_id,
            'participation_role' => $validated['role'],
            'points_awarded'     => $pointsAwarded,
            'recorded_by'        => Auth::user()->user_id,
        ]);

        PointCalculationService::recalculateTotal($employee->employee_id, $event->term_id);

        AuditService::log(
            actionType:  'attendance_recorded',
            targetId:    $attendance->attendance_id,
            description: "Recorded attendance for {$employee->employee_name} at event '{$event->title}' ({$validated['role']}, {$pointsAwarded} pts) via Quick Record.",
            metadata:    [
                'employee_id'        => $employee->employee_id,
                'event_id'           => $event->event_id,
                'participation_role' => $validated['role'],
                'points_awarded'     => $pointsAwarded,
            ],
        );

        return back()->with('success', "{$employee->employee_name} recorded ({$pointsAwarded} pts).");
    }
}
