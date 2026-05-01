<?php

namespace Database\Seeders;

use App\Models\OrganizationalUnit;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * RBAC has two tiers only:
     *   - ccfp_admin   : full system access, not bound to any unit.
     *   - representative: restricted access. Covers college_rep, sub_head, and
     *                     org_rep — all treated identically by the permission
     *                     layer (every `role !== 'ccfp_admin'` check). The role
     *                     value is an organisational title, not a privilege tier.
     *                     Visibility breadth is determined solely by where the
     *                     unit sits in the hierarchy, not by the role name.
     *
     * New user UUIDs must match real Supabase auth.users IDs.
     * Steps:
     *   1. Create each test account in Supabase Authentication dashboard.
     *   2. Copy the generated UUID into the matching constant below.
     *   3. Run: php artisan db:seed
     */

    // ── Supabase auth.users UUIDs ──────────────────────────────────────────────
    // Replace PLACEHOLDER values before seeding.

    const UUID_ADMIN       = '0fed0a5a-28df-44f6-a0b2-eac1ad5cb432';      // ccfp.admin@ccfp.test
    const UUID_COLLEGE_REP = '6da835ee-7b6a-42e0-9b1b-9693c513d7ef'; // ccs.head@ccfp.test
    const UUID_ACM_HEAD    = 'fe1969d9-8799-42e6-93f4-7ae5c42e31f9';   // acm.head@ccfp.test

    public function run(): void
    {
        // ── Organizational Units ───────────────────────────────────────────────
        // CCS is the parent college. ACM is a child organization under CCS.
        //
        // Visibility is driven by unit position in the hierarchy:
        //   - A representative assigned to CCS (parent) sees CCS + ACM.
        //   - A representative assigned to ACM sees ACM only.

        $ccs = OrganizationalUnit::firstOrCreate(
            ['unit_id' => 'CCS'],
            [
                'unit_name' => 'College of Computer Science',
                'unit_type' => 'college',
                'parent_id' => null,
            ]
        );

        $acm = OrganizationalUnit::firstOrCreate(
            ['unit_id' => 'ACM'],
            [
                'unit_name' => 'Association for Computing Machinery',
                'unit_type' => 'organization',
                'parent_id' => $ccs->unit_id,
            ]
        );

        // ── Users ──────────────────────────────────────────────────────────────

        // CCFP Admin — the only privileged tier; sees everything.
        $this->seedUser(
            email:   'testadmin@gmail.com',
            uuid:    self::UUID_ADMIN,
            name:    'CCFP Admin',
            role:    'ccfp_admin',
            unit_id: null,
        );

        // Representative: college_rep title, assigned to CCS (parent unit).
        // Sees CCS + ACM because CCS is a parent in the hierarchy.
        $this->seedUser(
            email:   'testhead@gmail.com',
            uuid:    self::UUID_COLLEGE_REP,
            name:    'CCS Head Representative',
            role:    'college_rep',
            unit_id: $ccs->unit_id,
        );

        // Representative: sub_head title, assigned to ACM (child of CCS).
        // Sees ACM only. Supervised by the CCS Head via the hierarchy.
        $this->seedUser(
            email:   'testacmhead@gmail.com',
            uuid:    self::UUID_ACM_HEAD,
            name:    'ACM Head',
            role:    'sub_head',
            unit_id: $acm->unit_id,
        );
    }

    /**
     * Insert/update a user only if a real UUID has been supplied.
     * Skips with a warning so the rest of the seed run completes even when
     * some Supabase auth accounts have not been created yet.
     */
    private function seedUser(string $email, string $uuid, string $name, string $role, ?string $unit_id): void
    {
        if (str_starts_with($uuid, 'REPLACE-')) {
            $this->command->warn("Skipped [{$email}]: replace the placeholder UUID in DatabaseSeeder before seeding.");
            return;
        }

        User::updateOrCreate(
            ['user_email' => $email],
            [
                'user_id'   => $uuid,
                'user_name' => $name,
                'role'      => $role,
                'unit_id'   => $unit_id,
            ]
        );
    }
}
