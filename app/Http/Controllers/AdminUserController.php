<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AdminUserController extends Controller
{
    /**
     * Store a newly created user in Supabase Auth and Profiles.
     */
    public function store(Request $request)
    {
        // 1. Validate request
        $validated = $request->validate([
            'email' => 'required|email|unique:profiles,user_email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:ccfp_admin,college_rep,org_rep',
            'unit_id' => 'required_if:role,college_rep,org_rep|exists:organizational_units,unit_id',
            'name' => 'required|string|max:255',
        ]);

        // 2. Prepare Supabase Admin API call
        $supabaseUrl = config('services.supabase.url');
        $serviceRoleKey = config('services.supabase.service_role_key');

        if (!$supabaseUrl || !$serviceRoleKey) {
            return response()->json(['message' => 'Supabase configuration is missing.'], 500);
        }

        try {
            // 3. Create user in Supabase Auth
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $serviceRoleKey,
                'apikey' => $serviceRoleKey,
                'Content-Type' => 'application/json',
            ])->post($supabaseUrl . '/auth/v1/admin/users', [
                'email' => $validated['email'],
                'password' => $validated['password'],
                'email_confirm' => true, // Auto-confirm email
                'user_metadata' => [
                    'name' => $validated['name'],
                    'role' => $validated['role'],
                ],
            ]);

            if ($response->failed()) {
                Log::error('Supabase Auth Creation Failed', ['response' => $response->json()]);
                return response()->json([
                    'message' => 'Failed to create user in Auth provider.',
                    'error' => $response->json()
                ], $response->status());
            }

            $supabaseUser = $response->json();
            $userId = $supabaseUser['id'];

            // 4. Update the profile row (which was created by the DB trigger)
            // The DB trigger create_profile_on_auth_user_insert() runs on Supabase.
            // We wait a brief moment or retry if the record isn't there yet,
            // though with Supabase Postgres it should be nearly instantaneous.
            
            $userProfile = User::where('user_id', $userId)->first();
            
            if (!$userProfile) {
                // Fail-safe: if trigger hasn't finished, wait a tiny bit
                usleep(500000); // 0.5s
                $userProfile = User::where('user_id', $userId)->first();
            }

            if ($userProfile) {
                $userProfile->update([
                    'role' => $validated['role'],
                    'unit_id' => $validated['unit_id'] ?? null,
                    'user_name' => $validated['name'],
                    'user_email' => $validated['email'],
                ]);
            } else {
                // If trigger failed for some reason, we manually create it as a fallback
                User::create([
                    'user_id' => $userId,
                    'user_name' => $validated['name'],
                    'user_email' => $validated['email'],
                    'role' => $validated['role'],
                    'unit_id' => $validated['unit_id'] ?? null,
                ]);
            }

            return response()->json([
                'message' => 'User created successfully.',
                'user' => [
                    'id' => $userId,
                    'email' => $validated['email'],
                    'role' => $validated['role']
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Admin User Creation Exception', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
