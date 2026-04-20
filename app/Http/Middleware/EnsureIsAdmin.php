<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'ccfp_admin') {
            // Return JSON for API/AJAX, redirect for standard web requests
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Forbidden. This action requires administrative privileges.'
                ], 403);
            }

            return redirect()->route('dashboard')->with('error', 'Access denied. CCFP Admin role required.');
        }

        return $next($request);
    }
}
