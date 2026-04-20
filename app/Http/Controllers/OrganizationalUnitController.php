<?php

namespace App\Http\Controllers;

use App\Models\OrganizationalUnit;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $units = $query
            ->whereNull('deleted_at')
            ->where('is_archived', false)
            ->orderBy('unit_name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('organizational-units', [
            'units'   => $units,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'unit_id'   => 'required|string|max:50|unique:organizational_units,unit_id',
            'unit_name' => 'required|string|max:255',
            'unit_type' => 'required|in:college,organization',
        ]);

        $unit = OrganizationalUnit::create($validated);

        AuditService::log(
            actionType:  'create_org_unit',
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
        ]);

        $before = $unit->only(['unit_name', 'unit_type']);
        $unit->update($validated);

        AuditService::log(
            actionType:  'update_org_unit',
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

        AuditService::log(
            actionType:  'delete_org_unit',
            targetId:    $id,
            description: "Soft-deleted organizational unit: {$unit->unit_name}.",
            metadata:    ['unit_name' => $unit->unit_name, 'unit_type' => $unit->unit_type],
        );

        return redirect()->route('organizational-units.index')
            ->with('success', 'Organizational unit archived.');
    }
}
