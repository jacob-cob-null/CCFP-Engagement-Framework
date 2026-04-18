<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class SupabaseRlsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user) {
            // Set the Postgres session variables so that the RLS policies are enforced.
            // These match the settings checked by the helper functions in supabase_rbac.sql
            
            // We use 'jwt.claims.sub' which is what auth.uid() usually resolves to in Supabase
            // Note: In a standard Postgres session, we might need to define a mock auth.uid() 
            // if it's not present, but our helper functions also check these session settings.
            
            DB::statement("SET local \"jwt.claims.sub\" = " . DB::getPdo()->quote($user->user_id));
            DB::statement("SET local \"jwt.claims.role\" = " . DB::getPdo()->quote($user->role));
            
            if ($user->unit_id) {
                DB::statement("SET local \"jwt.claims.unit_id\" = " . DB::getPdo()->quote($user->unit_id));
            }
        }

        return $next($request);
    }
}
