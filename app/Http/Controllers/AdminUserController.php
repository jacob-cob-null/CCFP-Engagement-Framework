<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\OrganizationalUnit;
use App\Services\AuditService;
use App\Services\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    // -------------------------------------------------------------------------
    // READ — List all user profiles
    // -------------------------------------------------------------------------

    /**
     * Display a listing of all system users (profiles).
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search by name or email
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'ilike', "%{$search}%")
                  ->orWhere('user_email', 'ilike', "%{$search}%");
            });
        }

        // Filter by role
        if ($role = $request->get('role')) {
            $query->where('role', $role);
        }

        // Filter by unit (college reps see only their unit)
        if (Auth::user()->role !== 'ccfp_admin') {
            $query->where('unit_id', Auth::user()->unit_id);
        } elseif ($unitId = $request->get('unit_id')) {
            $query->where('unit_id', $unitId);
        }

        $users = Inertia::defer(fn() => $query->orderBy('user_name')->paginate(25)->withQueryString());
        // Units dropdown served from file cache — avoids a second Supabase round-trip on every /users load
        $units = Cache::remember(CacheKeys::ORG_UNITS, CacheKeys::TTL_REFERENCE, fn() =>
            OrganizationalUnit::orderBy('unit_name')->get(['unit_id', 'unit_name', 'unit_type'])->toArray()
        );

        return Inertia::render('users', [
            'users'   => $users,
            'units'   => $units,
            'filters' => $request->only(['search', 'role', 'unit_id']),
        ]);
    }

    // -------------------------------------------------------------------------
    // CREATE — Add a new user via Supabase Auth + profiles
    // -------------------------------------------------------------------------

    /**
     * Store a newly created user in Supabase Auth and Profiles.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email|unique:profiles,user_email',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:ccfp_admin,college_rep,org_rep',
            'unit_id'  => 'required_if:role,college_rep,org_rep|nullable|exists:organizational_units,unit_id',
            'name'     => 'required|string|max:255',
        ]);

        $supabaseUrl    = config('services.supabase.url');
        $serviceRoleKey = config('services.supabase.service_role_key');

        if (!$supabaseUrl || !$serviceRoleKey) {
            return back()->withErrors(['message' => 'Supabase configuration is missing.']);
        }

        try {
            // 1. Create user in Supabase Auth
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $serviceRoleKey,
                'apikey'        => $serviceRoleKey,
                'Content-Type'  => 'application/json',
            ])->post($supabaseUrl . '/auth/v1/admin/users', [
                'email'         => $validated['email'],
                'password'      => $validated['password'],
                'email_confirm' => true,
                'user_metadata' => [
                    'name' => $validated['name'],
                    'role' => $validated['role'],
                ],
            ]);

            if ($response->failed()) {
                Log::error('Supabase Auth Creation Failed', ['response' => $response->json()]);
                return back()->withErrors(['message' => 'Failed to create user in Auth provider.']);
            }

            $userId = $response->json()['id'];

            // 2. Update or create the profile row (trigger may have already created it)
            $userProfile = User::where('user_id', $userId)->first();

            if (!$userProfile) {
                usleep(500000); // 0.5s — allow DB trigger to fire
                $userProfile = User::where('user_id', $userId)->first();
            }

            if ($userProfile) {
                $userProfile->update([
                    'role'       => $validated['role'],
                    'unit_id'    => $validated['unit_id'] ?? null,
                    'user_name'  => $validated['name'],
                    'user_email' => $validated['email'],
                ]);
            } else {
                User::create([
                    'user_id'    => $userId,
                    'user_name'  => $validated['name'],
                    'user_email' => $validated['email'],
                    'role'       => $validated['role'],
                    'unit_id'    => $validated['unit_id'] ?? null,
                ]);
            }

            // 3. Audit log
            AuditService::log(
                actionType:  'create_user',
                targetId:    $userId,
                description: "Created user account for {$validated['email']} with role {$validated['role']}.",
                metadata:    ['email' => $validated['email'], 'role' => $validated['role'], 'unit_id' => $validated['unit_id'] ?? null],
            );

            return redirect()->route('users.index')->with('success', 'User created successfully.');

        } catch (\Exception $e) {
            Log::error('Admin User Creation Exception', ['message' => $e->getMessage()]);
            return back()->withErrors(['message' => 'An unexpected error occurred.']);
        }
    }

    // -------------------------------------------------------------------------
    // UPDATE — Change role and/or unit assignment
    // -------------------------------------------------------------------------

    /**
     * Update an existing user profile (role and unit assignment).
     */
    public function update(Request $request, string $id)
    {
        $user = User::where('user_id', $id)->firstOrFail();

        $validated = $request->validate([
            'role'    => 'required|in:ccfp_admin,college_rep,org_rep',
            'unit_id' => 'required_if:role,college_rep,org_rep|nullable|exists:organizational_units,unit_id',
            'name'    => 'required|string|max:255',
        ]);

        $oldData = $user->only(['role', 'unit_id', 'user_name']);

        $user->update([
            'role'      => $validated['role'],
            'unit_id'   => $validated['unit_id'] ?? null,
            'user_name' => $validated['name'],
        ]);

        AuditService::log(
            actionType:  'update_user',
            targetId:    $id,
            description: "Updated user profile for {$user->user_email}.",
            metadata:    ['before' => $oldData, 'after' => $validated],
        );

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    // -------------------------------------------------------------------------
    // DELETE — Soft-delete the profile (revoke access)
    // -------------------------------------------------------------------------

    /**
     * Soft-delete a user profile. Marks deleted_at, profile remains in DB per data policy.
     */
    public function destroy(string $id)
    {
        // Prevent self-deletion
        if ($id === Auth::user()->user_id) {
            return back()->withErrors(['message' => 'You cannot deactivate your own account.']);
        }

        $user = User::where('user_id', $id)->whereNull('deleted_at')->firstOrFail();

        // Soft-delete the profile by setting deleted_at
        $user->update(['deleted_at' => now()]);

        AuditService::log(
            actionType:  'delete_user',
            targetId:    $id,
            description: "Soft-deleted user profile for {$user->user_email}.",
            metadata:    ['email' => $user->user_email, 'role' => $user->role],
        );

        return redirect()->route('users.index')->with('success', 'User deactivated successfully.');
    }
}
