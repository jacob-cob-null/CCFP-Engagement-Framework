<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuditService
{
    /**
     * Log an administrative action to the activity_logs table.
     *
     * @param  string       $actionType   Maps to the action_type enum in DB (e.g. 'create_user', 'update_employee')
     * @param  string|null  $targetId     UUID of the affected record (nullable for list/global actions)
     * @param  string       $description  Human-readable description of what happened
     * @param  array|null   $metadata     Optional arbitrary key-value context (old values, new values, etc.)
     */
    public static function log(
        string $actionType,
        ?string $targetId,
        string $description,
        ?array $metadata = null
    ): void {
        $userId = Auth::id() ?? Auth::user()?->user_id ?? null;

        if (!$userId) {
            Log::warning('AuditService::log called without an authenticated user.', [
                'action_type' => $actionType,
                'description' => $description,
            ]);
            return;
        }

        try {
            ActivityLog::create([
                'log_id'      => (string) Str::uuid(),
                'user_id'     => $userId,
                'action_type' => $actionType,
                'target_id'   => $targetId,
                'description' => $description,
                'metadata'    => $metadata,
            ]);
        } catch (\Exception $e) {
            // Audit failure must never break the main request flow.
            Log::error('AuditService failed to write log entry.', [
                'action_type' => $actionType,
                'error'       => $e->getMessage(),
            ]);
        }
    }
}
