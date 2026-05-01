<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\OrganizationalUnit;
use App\Services\AuditService;
use App\Services\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\AcademicTerm;
use App\Models\EmployeePointTotal;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with('unit')
            ->whereHas('unit', fn($q) => $q->where('unit_type', 'college'));

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('employee_name', 'ilike', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }

        if ($type = $request->get('personnel_type')) {
            $query->where('personnel_type', $type);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $user = Auth::user();
        if ($user->role !== 'ccfp_admin') {
            $query->where('unit_id', $user->unit_id);
        } elseif ($unitId = $request->get('unit_id')) {
            $query->where('unit_id', $unitId);
        }

        $query->whereNull('deleted_at');

        // Determine current term for points join/filtering
        $currentTerm = AcademicTerm::where('is_current', 'true')->first();
        $termId = $request->get('term_id', $currentTerm?->term_id);

        // Attach current term points to each employee via left join for display in the table
        $employees = Inertia::defer(fn() => $query
            ->leftJoin('employee_point_totals as ept', function ($join) use ($termId) {
                $join->on('employees.employee_id', '=', 'ept.employee_id')
                     ->where('ept.term_id', '=', $termId ?: DB::raw('null'));
            })
            ->select('employees.*', DB::raw('coalesce(ept.total_points, 0) as total_points'))
            ->orderBy('employee_name')
            ->paginate(25)
            ->withQueryString());

        // Units dropdown — only colleges; not served from the shared cache since it's a subset
        $units = OrganizationalUnit::active()
            ->where('unit_type', 'college')
            ->orderBy('unit_name')
            ->get(['unit_id', 'unit_name', 'unit_type'])
            ->toArray();

        // Points leaderboard (optional view) — lightweight paginated totals
        $currentTerm = AcademicTerm::where('is_current', 'true')->first();
        $termId = $request->get('term_id', $currentTerm?->term_id);

        $pointsQuery = EmployeePointTotal::with(['employee.unit'])
            ->whereHas('employee', function ($q) {
                $q->whereNull('deleted_at')
                  ->whereHas('unit', fn($uq) => $uq->where('unit_type', 'college'));
            });

        if ($termId) {
            $pointsQuery->where('term_id', $termId);
        }

        if ($user->role !== 'ccfp_admin') {
            $pointsQuery->whereHas('employee', function ($q) use ($user) { $q->where('unit_id', $user->unit_id); });
        } elseif ($unitId = $request->get('unit_id')) {
            $pointsQuery->whereHas('employee', function ($q) use ($unitId) { $q->where('unit_id', $unitId); });
        }

        if ($search = $request->get('points_search')) {
            $pointsQuery->whereHas('employee', function ($q) use ($search) {
                $q->where('employee_name', 'ilike', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }

        if ($type = $request->get('points_personnel_type')) {
            $pointsQuery->whereHas('employee', function ($q) use ($type) { $q->where('personnel_type', $type); });
        }

        $leaderboard = Inertia::defer(fn() => $pointsQuery->orderByDesc('total_points')->paginate(25)->withQueryString());

        $terms = Cache::remember(CacheKeys::ACADEMIC_TERMS, CacheKeys::TTL_REFERENCE, fn() =>
            AcademicTerm::orderByDesc('start_date')->get(['term_id', 'academic_year', 'semester', 'is_current'])->toArray()
        );

        return Inertia::render('employee', [
            'employees' => $employees,
            'units'     => $units,
            'filters'   => $request->only(['search', 'personnel_type', 'status', 'unit_id']),
            'leaderboard' => $leaderboard,
            'terms' => $terms,
            'pointsFilters' => [
                'search' => $request->get('points_search', ''),
                'term_id' => $termId,
                'unit_id' => $request->get('unit_id', ''),
                'personnel_type' => $request->get('points_personnel_type', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_number' => 'required|integer|unique:employees,employee_number',
            'employee_name'   => 'required|string|max:255',
            'personnel_type'  => 'required|in:teaching,non_teaching',
            'unit_id'         => 'required|exists:organizational_units,unit_id',
            'status'          => 'sometimes|in:active,inactive',
        ]);

        if (Auth::user()->role !== 'ccfp_admin') {
            $validated['unit_id'] = Auth::user()->unit_id;
        }

        $validated['employee_id'] = (string) Str::uuid();
        $validated['status'] = $validated['status'] ?? 'active';

        $employee = Employee::create($validated);

        AuditService::log(
            actionType:  'employee_created',
            targetId:    $employee->employee_id,
            description: "Created employee: {$employee->employee_name} (#{$employee->employee_number}).",
            metadata:    $validated,
        );

        return redirect()->route('employee.index')
            ->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $employee = Employee::where('employee_id', $id)
            ->when($user->role !== 'ccfp_admin', fn($q) => $q->where('unit_id', $user->unit_id))
            ->firstOrFail();

        $validated = $request->validate([
            'employee_number' => "required|integer|unique:employees,employee_number,{$employee->employee_number},employee_number",
            'employee_name'   => 'required|string|max:255',
            'personnel_type'  => 'required|in:teaching,non_teaching',
            'unit_id'         => 'required|exists:organizational_units,unit_id',
            'status'          => 'required|in:active,inactive',
        ]);

        if ($user->role !== 'ccfp_admin') {
            $validated['unit_id'] = $user->unit_id;
        }

        $before = $employee->only(['employee_name', 'employee_number', 'personnel_type', 'unit_id', 'status']);
        $employee->update($validated);

        AuditService::log(
            actionType:  'employee_updated',
            targetId:    $id,
            description: "Updated employee: {$employee->employee_name}.",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('employee.index')
            ->with('success', 'Employee updated successfully.');
    }

    public function destroy(string $id)
    {
        $employee = Employee::where('employee_id', $id)
            ->whereNull('deleted_at')
            ->when(Auth::user()->role !== 'ccfp_admin', fn($q) => $q->where('unit_id', Auth::user()->unit_id))
            ->firstOrFail();

        $employee->update([
            'deleted_at'  => now(),
            'is_archived' => true,
            'status'      => 'inactive',
        ]);

        AuditService::log(
            actionType:  'employee_deleted',
            targetId:    $id,
            description: "Soft-deleted employee: {$employee->employee_name} (#{$employee->employee_number}).",
            metadata:    ['name' => $employee->employee_name, 'number' => $employee->employee_number],
        );

        return redirect()->route('employee.index')
            ->with('success', 'Employee archived successfully.');
    }
}
