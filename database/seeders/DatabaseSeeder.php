<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\OrganizationalUnit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ensure at least one unit exists
        $unit = OrganizationalUnit::firstOrCreate(
            ['unit_id' => 'CCS'],
            [
                'unit_name' => 'College of Computer Science',
                'unit_type' => 'college',
            ]
        );

        // Seed Admin (Using existing Supabase Auth ID)
        User::updateOrCreate(
            ['user_email' => 'testadmin@gmail.com'],
            [
                'user_id'   => 'ffb0fa70-853e-4cbe-9279-a7b9dc80e3b5',
                'user_name' => 'Admin User',
                'role'      => 'ccfp_admin',
                'unit_id'   => null,
            ]
        );

        // Seed Representative (Using existing Supabase Auth ID)
        User::updateOrCreate(
            ['user_email' => 'testadmin2@gmail.com'],
            [
                'user_id'   => 'c4ec6e3a-8923-44c7-8312-6bc12259eeb2',
                'user_name' => 'Representative User',
                'role'      => 'org_rep',
                'unit_id'   => $unit->unit_id,
            ]
        );
    }
}
