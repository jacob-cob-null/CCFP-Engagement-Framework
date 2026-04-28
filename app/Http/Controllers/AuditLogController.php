<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')->orderByDesc('created_at');

        if ($actionType = $request->get('action_type')) {
            $query->where('action_type', $actionType);
        }

        if ($search = $request->get('search')) {
            $query->where('description', 'ilike', "%{$search}%");
        }

        $logs = $query->paginate(10)->withQueryString();

        // Get unique action types for the filter dropdown
        $actionTypes = ActivityLog::select('action_type')->distinct()->pluck('action_type')->toArray();

        return Inertia::render('admin/audit-logs', [
            'logs' => $logs,
            'actionTypes' => $actionTypes,
            'filters' => $request->only(['action_type', 'search']),
        ]);
    }
}
