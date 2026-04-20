<?php

namespace App\Services;

/**
 * Central registry for all cache key strings.
 * Using constants prevents typos and makes invalidation grep-able.
 */
class CacheKeys
{
    // ── Reference Data (slow-changing, safe to cache) ─────────────────────────

    /** OrganizationalUnit full list — used by Employee, Event, User dropdowns */
    public const ORG_UNITS = 'ccfp:ref:org_units';

    /** AcademicTerm full list — used by Event dropdowns and AttendanceController */
    public const ACADEMIC_TERMS = 'ccfp:ref:academic_terms';

    /** PointPolicy full list — used by AttendanceController for point calculation */
    public const POINT_POLICIES = 'ccfp:ref:point_policies';

    // ── TTLs (seconds) ────────────────────────────────────────────────────────

    /** Default TTL for reference data: 60 minutes */
    public const TTL_REFERENCE = 3600;

    /** Extended TTL for very stable data (point policies): 24 hours */
    public const TTL_STABLE = 86400;
}
