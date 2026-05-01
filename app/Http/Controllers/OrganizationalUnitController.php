<?php

namespace App\Http\Controllers;

use App\Models\OrganizationalUnit;
use App\Services\AuditService;
use App\Services\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrganizationalUnitController extends Controller
{
    public function index(Request $request)
    {
        $query = OrganizationalUnit::query();

        if ($search = $request->get('search')) {
            $query->where('unit_name', 'ilike', "%{$search}%");
        }

        if ($type = $request->get('type')) {
            $query->where('unit_type', $type);
        }

        // Only apply cache when no filters are active (filtered views are dynamic)
        // Always cache and return a paginator, never a collection/array
        $cacheKey = CacheKeys::ORG_UNITS . ':paginated';
        // Normalize: always work with a paginator-shaped array to avoid
        // storing/reading serialized LengthAwarePaginator instances from cache
        // (which can cause __PHP_Incomplete_Class errors on unserialize).
        $units = Inertia::defer(function () use ($request, $query, $cacheKey) {
            if ($request->hasAny(['search', 'type'])) {
                return $query->whereNull('deleted_at')
                    ->whereRaw('"is_archived" = false')
                    ->orderBy('unit_name')
                    ->paginate(25)
                    ->withQueryString()
                    ->toArray();
            } else {
                $unitsData = Cache::remember($cacheKey, CacheKeys::TTL_REFERENCE, function () {
                    return OrganizationalUnit::whereNull('deleted_at')
                        ->whereRaw('"is_archived" = false')
                        ->orderBy('unit_name')
                        ->paginate(25)
                        ->withQueryString()
                        ->toArray();
                });
                // If cache was polluted with a non-array value, clear and recache
                if (!is_array($unitsData) || !array_key_exists('data', $unitsData)) {
                    Cache::forget($cacheKey);
                    $unitsData = OrganizationalUnit::whereNull('deleted_at')
                        ->whereRaw('"is_archived" = false')
                        ->orderBy('unit_name')
                        ->paginate(25)
                        ->withQueryString()
                        ->toArray();
                    Cache::put($cacheKey, $unitsData, CacheKeys::TTL_REFERENCE);
                }
                return $unitsData;
            }
        });

        $colleges = OrganizationalUnit::whereNull('deleted_at')
            ->whereRaw('"is_archived" = false')
            ->where('unit_type', 'college')
            ->orderBy('unit_name')
            ->get(['unit_id', 'unit_name'])
            ->toArray();

        return Inertia::render('organizational-units', [
            'units'   => $units,
            'colleges' => $colleges,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'unit_id'   => 'required|string|max:50|unique:organizational_units,unit_id',
            'unit_name' => 'required|string|max:255',
            'unit_type' => 'required|in:college,organization',
            'parent_id' => 'required_if:unit_type,organization|nullable|exists:organizational_units,unit_id',
        ]);

        $unit = OrganizationalUnit::create($validated);

        $this->invalidateCache();

        AuditService::log(
            actionType:  'org_unit_created',
            targetId:    $unit->unit_id,
            description: "Created organizational unit: {$unit->unit_name} ({$unit->unit_type}).",
            metadata:    $validated,
        );

        return redirect()->route('organizational-units.index')
            ->with('success', 'Organizational unit created.');
    }

    public function update(Request $request, string $id)
    {
        $unit = OrganizationalUnit::where('unit_id', $id)->firstOrFail();

        $validated = $request->validate([
            'unit_name' => 'required|string|max:255',
            'unit_type' => 'required|in:college,organization',
            'parent_id' => 'required_if:unit_type,organization|nullable|exists:organizational_units,unit_id',
        ]);

        $before = $unit->only(['unit_name', 'unit_type', 'parent_id']);
        $unit->update($validated);

        $this->invalidateCache();

        AuditService::log(
            actionType:  'org_unit_updated',
            targetId:    $id,
            description: "Updated organizational unit: {$unit->unit_name}.",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('organizational-units.index')
            ->with('success', 'Organizational unit updated.');
    }

    public function destroy(string $id)
    {
        $unit = OrganizationalUnit::where('unit_id', $id)
            ->whereNull('deleted_at')
            ->firstOrFail();

        $unit->update([
            'deleted_at'  => now(),
            'is_archived' => true,
        ]);

        $this->invalidateCache();

        AuditService::log(
            actionType:  'org_unit_deleted',
            targetId:    $id,
            description: "Soft-deleted organizational unit: {$unit->unit_name}.",
            metadata:    ['unit_name' => $unit->unit_name, 'unit_type' => $unit->unit_type],
        );

        return redirect()->route('organizational-units.index')
            ->with('success', 'Organizational unit archived.');
    }

    // ── Cache Helper ───────────────────────────────────────────────────────────

    private function invalidateCache(): void
    {
        // Bust both the paginated page cache and the dropdown cache used by other controllers
        Cache::forget(CacheKeys::ORG_UNITS . ':paginated');
        Cache::forget(CacheKeys::ORG_UNITS);
    }
}
