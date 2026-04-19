<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\Fortify;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Auth;
use App\Auth\SupabaseGuard;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        User::observe(UserObserver::class);

        Fortify::authenticateUsing(function ($request) {
            $email = $request->email;
            $password = $request->password;

            $supabaseUrl = config('services.supabase.url');
            $supabaseKey = config('services.supabase.anon_key');

            try {
                // 1. Authenticate with Supabase
                $response = Http::withHeaders([
                    'apikey' => $supabaseKey,
                    'Content-Type' => 'application/json',
                ])->post($supabaseUrl . '/auth/v1/token?grant_type=password', [
                    'email' => $email,
                    'password' => $password,
                ]);

                if ($response->successful()) {
                    $authData = $response->json();
                    $userId = $authData['user']['id'];

                    // 2. Resolve the local profile
                    $user = User::where('user_id', $userId)->first();

                    if ($user) {
                        // Store the access token in session if needed for proxied calls later
                        session(['supabase_token' => $authData['access_token']]);
                        return $user;
                    }

                    Log::warning('Login successful in Supabase but profile missing in Laravel', ['user_id' => $userId]);
                }
            } catch (\Exception $e) {
                Log::error('Supabase Auth Bridge Exception', ['message' => $e->getMessage()]);
            }

            return null; // Auth failed
        });

        $this->configureDefaults();

        Auth::extend('supabase', function ($app, $name, array $config) {
            return new SupabaseGuard($app['request']);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
