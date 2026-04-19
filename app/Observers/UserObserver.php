<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class UserObserver
{
    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        $this->invalidateCache($user);
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->invalidateCache($user);
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        $this->invalidateCache($user);
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        $this->invalidateCache($user);
    }

    /**
     * Invalidate the cache for the given user.
     */
    protected function invalidateCache(User $user): void
    {
        Cache::forget("auth_user_{$user->user_id}");
    }
}
