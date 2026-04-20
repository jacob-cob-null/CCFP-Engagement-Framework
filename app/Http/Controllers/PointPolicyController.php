<?php

namespace App\Http\Controllers;

use App\Models\PointPolicy;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PointPolicyController extends Controller
{
    public function index()
    {
        $policies = PointPolicy::orderBy('participation_role')->get();

        return Inertia::render('point-policies', [
            'policies' => $policies,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'participation_role' => 'required|in:participant,organizer,donor|unique:point_policies,participation_role',
            'default_points'     => 'required|integer|min:0',
        ]);

        $validated['policy_id'] = (string) Str::uuid();
        $policy = PointPolicy::create($validated);

        AuditService::log(
            actionType:  'create_point_policy',
            targetId:    $policy->policy_id,
            description: "Created point policy: {$policy->participation_role} = {$policy->default_points} pts.",
            metadata:    $validated,
        );

        return redirect()->route('point-policies.index')
            ->with('success', 'Point policy created.');
    }

    public function update(Request $request, string $id)
    {
        $policy = PointPolicy::where('policy_id', $id)->firstOrFail();

        $validated = $request->validate([
            'default_points' => 'required|integer|min:0',
        ]);

        $before = ['default_points' => $policy->default_points];
        $policy->update($validated);

        AuditService::log(
            actionType:  'update_point_policy',
            targetId:    $id,
            description: "Updated point policy for {$policy->participation_role}: {$before['default_points']} → {$validated['default_points']} pts.",
            metadata:    ['role' => $policy->participation_role, 'before' => $before, 'after' => $validated],
        );

        return redirect()->route('point-policies.index')
            ->with('success', 'Point policy updated.');
    }

    public function destroy(string $id)
    {
        $policy = PointPolicy::where('policy_id', $id)->firstOrFail();
        $role   = $policy->participation_role;

        $policy->delete();

        AuditService::log(
            actionType:  'delete_point_policy',
            targetId:    $id,
            description: "Deleted point policy for role: {$role}.",
            metadata:    ['role' => $role],
        );

        return redirect()->route('point-policies.index')
            ->with('success', 'Point policy deleted.');
    }
}
