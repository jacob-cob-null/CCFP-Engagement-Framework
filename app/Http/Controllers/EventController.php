<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\Event;
use App\Models\EventPointOverride;
use App\Models\OrganizationalUnit;
use App\Services\AuditService;
use App\Services\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['term', 'unit', 'pointOverrides']);

        if ($search = $request->get('search')) {
            $query->where('title', 'ilike', "%{$search}%");
        }

        if ($scope = $request->get('scope')) {
            $query->where('scope', $scope);
        }

        if ($termId = $request->get('term_id')) {
            $query->where('term_id', $termId);
        }

        $user = Auth::user();
        if ($user->role !== 'ccfp_admin') {
            $query->whereRaw(
                '"events"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                [$user->user_id]
            );
        } elseif ($unitId = $request->get('unit_id')) {
            $query->where('unit_id', $unitId);
        }

        $query->active();

        // Both dropdowns served from cache — save 2 remote DB round-trips per request
        $terms = Cache::remember(CacheKeys::ACADEMIC_TERMS, CacheKeys::TTL_REFERENCE, fn() =>
            AcademicTerm::orderByDesc('start_date')->get(['term_id', 'academic_year', 'semester', 'is_current'])->toArray()
        );

        $units = Cache::remember(CacheKeys::ORG_UNITS, CacheKeys::TTL_REFERENCE, fn() =>
            OrganizationalUnit::active()->orderBy('unit_name')->get(['unit_id', 'unit_name', 'unit_type'])->toArray()
        );

        return Inertia::render('events/setup', [
            'events'  => Inertia::defer(fn() => $query->orderByDesc('event_date')->paginate(25)->withQueryString()),
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
            'point_overrides'  => 'nullable|array',
            'point_overrides.*.participation_role' => 'required|in:participant,organizer,donor',
            'point_overrides.*.points_awarded'     => 'required|integer|min:0',
        ]);

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

        foreach ($overrides as $override) {
            EventPointOverride::create([
                'override_id'        => (string) Str::uuid(),
                'event_id'           => $event->event_id,
                'participation_role' => $override['participation_role'],
                'points_awarded'     => $override['points_awarded'],
            ]);
        }

        AuditService::log(
            actionType:  'event_created',
            targetId:    $event->event_id,
            description: "Created event: {$event->title} (scope: {$event->scope}).",
            metadata:    $validated,
        );

        return redirect()->route('events.setup')
            ->with('success', 'Event created successfully.');
    }

    public function update(Request $request, string $id)
    {
        $user  = Auth::user();
        $event = Event::where('event_id', $id)->active()
            ->when($user->role !== 'ccfp_admin', fn($q) => $q->whereRaw(
                '"events"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                [$user->user_id]
            ))
            ->firstOrFail();

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
            $validated['unit_id'] = $user->unit_id;
        }

        $overrides = $validated['point_overrides'] ?? [];
        unset($validated['point_overrides']);

        $before = $event->only(['title', 'scope', 'event_date', 'term_id', 'unit_id']);
        $event->update($validated);

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
            actionType:  'event_edited',
            targetId:    $id,
            description: "Updated event: {$event->title}.",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('events.setup')
            ->with('success', 'Event updated successfully.');
    }

    public function destroy(string $id)
    {
        $event = Event::where('event_id', $id)->active()
            ->when(Auth::user()->role !== 'ccfp_admin', fn($q) => $q->whereRaw(
                '"events"."unit_id" IN (SELECT unit_id FROM public.visible_unit_ids_for_user(?))',
                [Auth::user()->user_id]
            ))
            ->firstOrFail();

        $event->update([
            'deleted_at'  => now(),
            'is_archived' => true,
        ]);

        AuditService::log(
            actionType:  'event_deleted',
            targetId:    $id,
            description: "Soft-deleted event: {$event->title}.",
            metadata:    ['title' => $event->title, 'scope' => $event->scope],
        );

        return redirect()->route('events.setup')
            ->with('success', 'Event archived successfully.');
    }
}
