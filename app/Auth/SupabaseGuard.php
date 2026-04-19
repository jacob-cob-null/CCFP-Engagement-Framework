<?php

namespace App\Auth;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SupabaseGuard implements Guard
{
    protected $request;
    protected $user;
    protected $secret;

    public function __construct(Request $request)
    {
        $this->request = $request;
        $this->secret = config('auth.supabase_jwt_secret');
    }

    public function check()
    {
        return !is_null($this->user());
    }

    public function guest()
    {
        return !$this->check();
    }

    public function user()
    {
        if (!is_null($this->user)) {
            return $this->user;
        }

        $token = $this->request->bearerToken();

        if (!$token) {
            return null;
        }

        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            
            // Supabase JWTs use 'sub' for the user UUID
            $userId = $decoded->sub ?? null;

            if (!$userId) {
                return null;
            }

            // Cache the user model to avoid expensive remote DB trips on every request
            $user = Cache::remember("auth_user_{$userId}", now()->addHour(), function () use ($userId) {
                return User::where('user_id', $userId)->first();
            });

            if ($user) {
                // Attach the JWT claims to the user object for middleware use
                $user->jwt_claims = (array) $decoded;
                $this->user = $user;
                return $this->user;
            }
        } catch (\Exception $e) {
            Log::warning('Supabase JWT validation failed: ' . $e->getMessage());
            return null;
        }

        return null;
    }

    public function id()
    {
        return $this->user() ? $this->user()->getAuthIdentifier() : null;
    }

    public function validate(array $credentials = [])
    {
        return false; // Not used for token-based auth
    }

    public function setUser($user)
    {
        $this->user = $user;
    }

    public function hasUser()
    {
        return !is_null($this->user);
    }
}
