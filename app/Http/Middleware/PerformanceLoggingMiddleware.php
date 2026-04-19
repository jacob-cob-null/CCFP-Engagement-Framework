<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PerformanceLoggingMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        // Only profile Inertia requests or standard GET requests to avoid logging API/polling noise
        if (!$request->expectsJson() && $request->method() !== 'GET') {
            return $next($request);
        }

        DB::enableQueryLog();
        $start = microtime(true);

        $response = $next($request);

        // Only log performance for authenticated users
        if (Auth::check()) {
            $duration = microtime(true) - $start;
            $queries = DB::getQueryLog();
            $queryCount = count($queries);

            try {
                // Insert directly into activity_logs using the pooler connection
                DB::table('activity_logs')->insert([
                    'log_id' => (string) Str::uuid(),
                    'user_id' => Auth::id(),
                    'action_type' => 'performance',
                    'description' => "Performance check for " . $request->path(),
                    'metadata' => json_encode([
                        'duration_ms' => round($duration * 1000, 2),
                        'query_count' => $queryCount,
                        'url' => $request->fullUrl(),
                        'method' => $request->method(),
                    ]),
                    'created_at' => now(),
                ]);
            } catch (\Exception $e) {
                // Fail silently to not break the page transition
                \Illuminate\Support\Facades\Log::error('Performance logging failed: ' . $e->getMessage());
            }
        }

        return $response;
    }
}
