<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\OrganizationalUnit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['ccfp_admin', 'college_rep'])) {
            abort(403);
        }

        $query = ActivityLog::with('user')->orderByDesc('created_at');

        // college_rep: own actions + actions by users in child org units
        if ($user->role === 'college_rep') {
            $childUnitIds = OrganizationalUnit::where('parent_id', $user->unit_id)->pluck('unit_id');
            $accessibleUserIds = User::whereIn('unit_id', $childUnitIds)->pluck('user_id');

            $query->where(function ($q) use ($user, $accessibleUserIds) {
                $q->where('user_id', $user->user_id)
                  ->orWhereIn('user_id', $accessibleUserIds);
            });
        }

        if ($actionType = $request->get('action_type')) {
            $query->where('action_type', $actionType);
        }

        if ($search = $request->get('search')) {
            $query->where('description', 'ilike', "%{$search}%");
        }

        $logs = $query->paginate(10)->withQueryString();

        $typesQuery = ActivityLog::select('action_type')->distinct();
        if ($user->role === 'college_rep') {
            $childUnitIds      = OrganizationalUnit::where('parent_id', $user->unit_id)->pluck('unit_id');
            $accessibleUserIds = User::whereIn('unit_id', $childUnitIds)->pluck('user_id');
            $typesQuery->where(function ($q) use ($user, $accessibleUserIds) {
                $q->where('user_id', $user->user_id)
                  ->orWhereIn('user_id', $accessibleUserIds);
            });
        }
        $actionTypes = $typesQuery->pluck('action_type')->toArray();

        return Inertia::render('admin/audit-logs', [
            'logs'        => $logs,
            'actionTypes' => $actionTypes,
            'filters'     => $request->only(['action_type', 'search']),
        ]);
    }
}
