<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AcademicTermController extends Controller
{
    public function index(Request $request)
    {
        $terms = AcademicTerm::orderByDesc('start_date')->get();

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

        // Only one term can be current at a time
        if (!empty($validated['is_current'])) {
            AcademicTerm::query()->update(['is_current' => false]);
        }

        $term = AcademicTerm::create($validated);

        AuditService::log(
            actionType:  'create_academic_term',
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

        if (!empty($validated['is_current'])) {
            AcademicTerm::query()->where('term_id', '!=', $id)->update(['is_current' => false]);
        }

        $before = $term->only(['academic_year', 'semester', 'start_date', 'end_date', 'is_current']);
        $term->update($validated);

        AuditService::log(
            actionType:  'update_academic_term',
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

        // Prevent deletion if events reference this term
        $eventCount = $term->events()->count();
        if ($eventCount > 0) {
            return back()->withErrors([
                'message' => "Cannot delete this term — {$eventCount} event(s) are linked to it."
            ]);
        }

        $term->delete();

        AuditService::log(
            actionType:  'delete_academic_term',
            targetId:    $id,
            description: "Deleted academic term: {$term->academic_year} {$term->semester}.",
            metadata:    ['term_id' => $id],
        );

        return redirect()->route('academic-terms.index')
            ->with('success', 'Academic term deleted.');
    }
}
