<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class PerformanceLoggingMiddleware
{
    /**
     * Map routes to human-readable activity logs.
     */
    protected array $routeMap = [
        'dashboard' => ['type' => 'page_view', 'desc' => 'Viewed Dashboard'],
        'attendance' => ['type' => 'page_view', 'desc' => 'Checked Attendance Tracking'],
        'employee' => ['type' => 'page_view', 'desc' => 'Viewed Employee Directory'],
        'events.setup' => ['type' => 'page_view', 'desc' => 'Visited Events Setup'],
        'statistics' => ['type' => 'page_view', 'desc' => 'Analyzed Statistics'],
        'profile.edit' => ['type' => 'page_view', 'desc' => 'Accessed Profile Settings'],
        'profile.update' => ['type' => 'profile_updated', 'desc' => 'Updated Profile Information'],
        'profile.destroy' => ['type' => 'user_deleted', 'desc' => 'Deleted User Account'],
        'security.edit' => ['type' => 'page_view', 'desc' => 'Accessed Security Settings'],
        'user-password.update' => ['type' => 'security_updated', 'desc' => 'Changed Account Password'],
        'appearance.edit' => ['type' => 'page_view', 'desc' => 'Accessed Appearance Settings'],
        'api/admin/users' => ['type' => 'user_created', 'desc' => 'Created New User Account'],
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Don't log background polling or dev requests
        if ($request->is('_debugbar*') || $request->is('telescope*') || $request->is('_ignition*') || $request->is('up')) {
            return $next($request);
        }

        DB::enableQueryLog();
        $start = microtime(true);

        $response = $next($request);

        // Only log for authenticated users
        if (Auth::check()) {
            $duration = microtime(true) - $start;
            $queries = DB::getQueryLog();
            $queryCount = count($queries);

            $this->logActivity($request, $duration, $queryCount);
        }

        return $response;
    }

    /**
     * Log the activity to the database.
     */
    protected function logActivity(Request $request, float $duration, int $queryCount): void
    {
        $routeName = Route::currentRouteName();
        $path = $request->path();
        $method = $request->method();
        
        // Determine the action type and description from Route Name or Path
        if ($routeName && isset($this->routeMap[$routeName])) {
            $actionType = $this->routeMap[$routeName]['type'];
            $description = $this->routeMap[$routeName]['desc'];
        } elseif (isset($this->routeMap[$path])) {
            $actionType = $this->routeMap[$path]['type'];
            $description = $this->routeMap[$path]['desc'];
        } else {
            // Fallback for unmapped routes
            $actionType = ($method === 'GET') ? 'page_view' : 'system_activity';
            $description = ($method === 'GET') ? "Visited " . $path : "Performed " . $method . " on " . $path;
        }

        // Cleanup: Don't log every single technical page view if they are too frequent
        // but for 20 users, it's better to have more granularity as requested.

        try {
            DB::table('activity_logs')->insert([
                'log_id' => (string) Str::uuid(),
                'user_id' => Auth::id(),
                'action_type' => $actionType,
                'description' => $description,
                'metadata' => json_encode([
                    'duration_ms' => round($duration * 1000, 2),
                    'query_count' => $queryCount,
                    'url' => $request->fullUrl(),
                    'method' => $method,
                    'route' => $routeName,
                    'is_inertia' => $request->header('X-Inertia') ? true : false,
                ]),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Activity logging failed: ' . $e->getMessage());
        }
    }
}
