<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\EmployeePointTotal;
use App\Models\Event;
use App\Models\EventPointOverride;
use App\Models\PointPolicy;
use App\Services\CacheKeys;
use Illuminate\Support\Facades\Cache;

/**
 * Centralised point calculation engine.
 *
 * Used by both AttendanceController (desktop) and LiveAttendanceController
 * (mobile) so the same logic governs all attendance recording paths.
 */
class PointCalculationService
{
    /**
     * Determine how many points to award for a given event + participation role.
     *
     * Priority:
     *   1. Event-specific point override (event_point_overrides table)
     *   2. Global point policy (point_policies table, cached)
     *   3. Hard-coded fallback → 1 point
     */
    public static function calculatePoints(Event $event, string $participationRole): int
    {
        // 1. Check for event-specific override
        $override = EventPointOverride::where('event_id', $event->event_id)
            ->where('participation_role', $participationRole)
            ->first();

        if ($override) {
            return $override->points_awarded;
        }

        // 2. Fall back to cached global policy
        $policiesCache = Cache::remember(CacheKeys::POINT_POLICIES, CacheKeys::TTL_STABLE, fn() =>
            PointPolicy::orderBy('participation_role')->get()->toArray()
        );

        $policies = collect($policiesCache)->keyBy('participation_role');

        return $policies[$participationRole]['default_points'] ?? 1;
    }

    /**
     * Recalculate and upsert the running point total for an employee in a term.
     *
     * Sums all active (non-archived) attendance records linked to active events
     * within the given term. Preserves the row even when the sum drops to 0.
     *
     * NOTE: This method intentionally does NOT clear the total — the business
     * rule states that semester archiving must preserve annual running totals.
     */
    public static function recalculateTotal(string $employeeId, string $termId): void
    {
        $total = Attendance::where('employee_id', $employeeId)
            ->whereHas('event', fn($q) => $q->where('term_id', $termId)->active())
            ->active()
            ->sum('points_awarded');

        EmployeePointTotal::updateOrInsert(
            ['employee_id' => $employeeId, 'term_id' => $termId],
            ['total_points' => (int) $total, 'last_calculated_at' => now()]
        );
    }
}
