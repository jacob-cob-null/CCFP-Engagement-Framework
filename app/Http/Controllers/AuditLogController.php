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

        // Resolve the set of user IDs visible to this viewer — computed once, reused for
        // the main query, action-type dropdown, and user dropdown.
        $accessibleUserIds = null;
        $filterableUsers   = null;

        if ($user->role === 'college_rep') {
            $childUnitIds      = OrganizationalUnit::where('parent_id', $user->unit_id)->pluck('unit_id');
            $accessibleUserIds = User::whereIn('unit_id', $childUnitIds)->pluck('user_id')->push($user->user_id);
            $filterableUsers   = User::whereIn('user_id', $accessibleUserIds)
                                     ->orderBy('user_name')
                                     ->get(['user_id', 'user_name'])
                                     ->toArray();
        } else {
            // Admin: only show users who actually appear in the logs
            $filterableUsers = User::whereIn('user_id', ActivityLog::select('user_id')->distinct())
                                   ->orderBy('user_name')
                                   ->get(['user_id', 'user_name'])
                                   ->toArray();
        }

        $query = ActivityLog::with('user')->orderByDesc('created_at');

        if ($accessibleUserIds !== null) {
            $query->whereIn('user_id', $accessibleUserIds);
        }

        if ($filterUserId = $request->get('user_id')) {
            $query->where('user_id', $filterUserId);
        }

        if ($actionType = $request->get('action_type')) {
            $query->where('action_type', $actionType);
        }

        if ($search = $request->get('search')) {
            $query->where('description', 'ilike', "%{$search}%");
        }

        $logs = $query->paginate(10)->withQueryString();

        $typesQuery = ActivityLog::select('action_type')->distinct();
        if ($accessibleUserIds !== null) {
            $typesQuery->whereIn('user_id', $accessibleUserIds);
        }
        $actionTypes = $typesQuery->pluck('action_type')->toArray();

        return Inertia::render('admin/audit-logs', [
            'logs'            => $logs,
            'actionTypes'     => $actionTypes,
            'filterableUsers' => $filterableUsers,
            'filters'         => $request->only(['action_type', 'search', 'user_id']),
        ]);
    }
}
