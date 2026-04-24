<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\EmployeePointTotal;
use App\Models\OrganizationalUnit;
use App\Services\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class EmployeePointsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'ccfp_admin';
        $unitId = $user->unit_id;

        $currentTerm = AcademicTerm::where('is_current', 'true')->first();
        $termId = $request->get('term_id', $currentTerm?->term_id);

        $query = EmployeePointTotal::with(['employee.unit'])
            ->whereHas('employee', function ($q) {
                $q->whereNull('deleted_at');
            });

        if ($termId) {
            $query->where('term_id', $termId);
        }

        if (!$isAdmin) {
             $query->whereHas('employee', function ($q) use ($unitId) {
                $q->where('unit_id', $unitId);
             });
        } elseif ($filterUnitId = $request->get('unit_id')) {
             $query->whereHas('employee', function ($q) use ($filterUnitId) {
                $q->where('unit_id', $filterUnitId);
             });
        }

        if ($search = $request->get('search')) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('employee_name', 'ilike', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }

        if ($type = $request->get('personnel_type')) {
            $query->whereHas('employee', function ($q) use ($type) {
                 $q->where('personnel_type', $type);
            });
        }

        $leaderboard = $query->orderByDesc('total_points')
            ->paginate(25)
            ->withQueryString();

        $terms = Cache::remember(CacheKeys::ACADEMIC_TERMS, CacheKeys::TTL_REFERENCE, fn() =>
            AcademicTerm::orderByDesc('start_date')->get(['term_id', 'academic_year', 'semester', 'is_current'])->toArray()
        );

        $units = Cache::remember(CacheKeys::ORG_UNITS, CacheKeys::TTL_REFERENCE, fn() =>
            OrganizationalUnit::active()->orderBy('unit_name')->get(['unit_id', 'unit_name', 'unit_type'])->toArray()
        );

        return Inertia::render('employee-points', [
            'leaderboard' => $leaderboard,
            'terms' => $terms,
            'units' => $units,
            'filters' => [
                'search' => $request->get('search', ''),
                'term_id' => $termId,
                'unit_id' => $request->get('unit_id', ''),
                'personnel_type' => $request->get('personnel_type', ''),
            ]
        ]);
    }
}
