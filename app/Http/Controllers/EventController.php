<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\Event;
use App\Models\EventPointOverride;
use App\Models\OrganizationalUnit;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['term', 'unit']);

        if ($search = $request->get('search')) {
            $query->where('title', 'ilike', "%{$search}%");
        }

        if ($scope = $request->get('scope')) {
            $query->where('scope', $scope);
        }

        if ($termId = $request->get('term_id')) {
            $query->where('term_id', $termId);
        }

        // Scope enforcement: non-admins see only their unit's events
        $user = Auth::user();
        if ($user->role !== 'ccfp_admin') {
            $query->where('unit_id', $user->unit_id);
        } elseif ($unitId = $request->get('unit_id')) {
            $query->where('unit_id', $unitId);
        }

        $query->active();

        $events = $query->orderByDesc('event_date')->paginate(25)->withQueryString();
        $terms = AcademicTerm::orderByDesc('start_date')->get(['term_id', 'academic_year', 'semester', 'is_current']);
        $units = OrganizationalUnit::active()->orderBy('unit_name')->get(['unit_id', 'unit_name', 'unit_type']);

        return Inertia::render('events/setup', [
            'events'  => $events,
            'terms'   => $terms,
            'units'   => $units,
            'filters' => $request->only(['search', 'scope', 'term_id', 'unit_id']),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'scope'            => 'required|in:university,college,organization',
            'activity_program' => 'nullable|string|max:255',
            'term_id'          => 'required|exists:academic_terms,term_id',
            'unit_id'          => 'required|exists:organizational_units,unit_id',
            'event_date'       => 'required|date',
            // Optional per-event point overrides
            'point_overrides'  => 'nullable|array',
            'point_overrides.*.participation_role' => 'required|in:participant,organizer,donor',
            'point_overrides.*.points_awarded'     => 'required|integer|min:0',
        ]);

        // Enforce scope restriction for non-admins
        if ($user->role !== 'ccfp_admin') {
            if ($validated['scope'] === 'university') {
                return back()->withErrors(['scope' => 'You cannot create university-scoped events.']);
            }
            $validated['unit_id'] = $user->unit_id;
        }

        $overrides = $validated['point_overrides'] ?? [];
        unset($validated['point_overrides']);

        $validated['event_id']   = (string) Str::uuid();
        $validated['created_by'] = $user->user_id;

        $event = Event::create($validated);

        // Save per-event point overrides if provided
        foreach ($overrides as $override) {
            EventPointOverride::create([
                'override_id'        => (string) Str::uuid(),
                'event_id'           => $event->event_id,
                'participation_role' => $override['participation_role'],
                'points_awarded'     => $override['points_awarded'],
            ]);
        }

        AuditService::log(
            actionType:  'create_event',
            targetId:    $event->event_id,
            description: "Created event: {$event->title} (scope: {$event->scope}).",
            metadata:    $validated,
        );

        return redirect()->route('events.setup')
            ->with('success', 'Event created successfully.');
    }

    public function update(Request $request, string $id)
    {
        $event = Event::where('event_id', $id)->active()->firstOrFail();
        $user  = Auth::user();

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'scope'            => 'required|in:university,college,organization',
            'activity_program' => 'nullable|string|max:255',
            'term_id'          => 'required|exists:academic_terms,term_id',
            'unit_id'          => 'required|exists:organizational_units,unit_id',
            'event_date'       => 'required|date',
            'point_overrides'  => 'nullable|array',
            'point_overrides.*.participation_role' => 'required|in:participant,organizer,donor',
            'point_overrides.*.points_awarded'     => 'required|integer|min:0',
        ]);

        if ($user->role !== 'ccfp_admin') {
            if ($validated['scope'] === 'university') {
                return back()->withErrors(['scope' => 'You cannot set university scope.']);
            }
        }

        $overrides = $validated['point_overrides'] ?? [];
        unset($validated['point_overrides']);

        $before = $event->only(['title', 'scope', 'event_date', 'term_id', 'unit_id']);
        $event->update($validated);

        // Replace overrides
        EventPointOverride::where('event_id', $id)->delete();
        foreach ($overrides as $override) {
            EventPointOverride::create([
                'override_id'        => (string) Str::uuid(),
                'event_id'           => $id,
                'participation_role' => $override['participation_role'],
                'points_awarded'     => $override['points_awarded'],
            ]);
        }

        AuditService::log(
            actionType:  'update_event',
            targetId:    $id,
            description: "Updated event: {$event->title}.",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('events.setup')
            ->with('success', 'Event updated successfully.');
    }

    public function destroy(string $id)
    {
        $event = Event::where('event_id', $id)->active()->firstOrFail();

        $event->update([
            'deleted_at'  => now(),
            'is_archived' => true,
        ]);

        AuditService::log(
            actionType:  'delete_event',
            targetId:    $id,
            description: "Soft-deleted event: {$event->title}.",
            metadata:    ['title' => $event->title, 'scope' => $event->scope],
        );

        return redirect()->route('events.setup')
            ->with('success', 'Event archived successfully.');
    }
}
