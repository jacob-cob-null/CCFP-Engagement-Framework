<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Services\AuditService;
use App\Services\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AcademicTermController extends Controller
{
    public function index(Request $request)
    {
        $terms = Inertia::defer(fn() => 
            AcademicTerm::orderByDesc('start_date')->paginate(10)->withQueryString()
        );

        return Inertia::render('academic-terms', [
            'terms' => $terms,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'term_id'       => 'required|date|unique:academic_terms,term_id',
            'academic_year' => 'required|string|max:20',
            'semester'      => 'required|in:1st,2nd,summer',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after:start_date',
            'is_current'    => 'boolean',
        ]);

        $validated['is_current'] = $request->boolean('is_current');

        if ($validated['is_current']) {
            AcademicTerm::query()->update(['is_current' => DB::raw('false')]);
        }

        // Ensure Postgres receives boolean literals, not integers
        if (isset($validated['is_current'])) {
            $validated['is_current'] = $validated['is_current'] ? DB::raw('true') : DB::raw('false');
        }

        $term = AcademicTerm::create($validated);

        $this->invalidateCache();

        AuditService::log(
            actionType:  'term_created',
            targetId:    $term->term_id,
            description: "Created academic term: {$term->academic_year} {$term->semester} semester.",
            metadata:    $validated,
        );

        return redirect()->route('academic-terms.index')
            ->with('success', 'Academic term created.');
    }

    public function update(Request $request, string $id)
    {
        $term = AcademicTerm::where('term_id', $id)->firstOrFail();

        $validated = $request->validate([
            'academic_year' => 'required|string|max:20',
            'semester'      => 'required|in:1st,2nd,summer',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after:start_date',
            'is_current'    => 'boolean',
        ]);

        $validated['is_current'] = $request->boolean('is_current');

        if ($validated['is_current']) {
            AcademicTerm::query()->where('term_id', '!=', $id)->update(['is_current' => DB::raw('false')]);
        }

        $before = $term->only(['academic_year', 'semester', 'start_date', 'end_date', 'is_current']);
        $term->update($validated);

        $this->invalidateCache();

        AuditService::log(
            actionType:  'term_updated',
            targetId:    $id,
            description: "Updated academic term: {$term->academic_year} {$term->semester} semester.",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('academic-terms.index')
            ->with('success', 'Academic term updated.');
    }

    public function destroy(string $id)
    {
        $term = AcademicTerm::where('term_id', $id)->firstOrFail();

        $eventCount = $term->events()->count();
        if ($eventCount > 0) {
            return back()->withErrors([
                'message' => "Cannot delete this term — {$eventCount} event(s) are linked to it."
            ]);
        }

        $term->delete();

        $this->invalidateCache();

        AuditService::log(
            actionType:  'term_deleted',
            targetId:    $id,
            description: "Deleted academic term: {$term->academic_year} {$term->semester}.",
            metadata:    ['term_id' => $id],
        );

        return redirect()->route('academic-terms.index')
            ->with('success', 'Academic term deleted.');
    }

    // ── Cache Helper ───────────────────────────────────────────────────────────

    private function invalidateCache(): void
    {
        Cache::forget(CacheKeys::ACADEMIC_TERMS);
    }
}
