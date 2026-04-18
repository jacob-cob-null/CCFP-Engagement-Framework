<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedSupabaseRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'supabase:seed-roles {--file= : Optional CSV file path (user_id,role,unit_id)} {--admins= : Comma-separated admin UUIDs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed or update `profiles` from auth.users or from a CSV';

    public function handle()
    {
        $file = $this->option('file');

        if ($file) {
            if (!file_exists($file)) {
                $this->error("File not found: $file");
                return 1;
            }

            $rows = array_map('str_getcsv', file($file));
            foreach ($rows as $row) {
                $uuid = $row[0] ?? null;
                $role = $row[1] ?? null;
                $unit_id = $row[2] ?? null;

                if (!$uuid || !$role) {
                    $this->warn('Skipping invalid row: ' . implode(',', $row));
                    continue;
                }

                $email = DB::table('auth.users')->where('id', $uuid)->value('email');

                DB::table('profiles')->updateOrInsert(
                    ['user_id' => $uuid],
                    [
                        'role' => $role,
                        'unit_id' => $unit_id,
                        'user_email' => $email,
                        'user_name' => $email ?? $uuid,
                        'updated_at' => now(),
                        'created_at' => now()
                    ]
                );

                $this->info("Upserted $uuid => $role");
            }

            $this->info('Done processing CSV.');
            return 0;
        }

        // Set admins from option if provided
        $adminList = $this->option('admins');
        if ($adminList) {
            $ids = array_filter(array_map('trim', explode(',', $adminList)));
            foreach ($ids as $id) {
                DB::table('profiles')->updateOrInsert(
                    ['user_id' => $id],
                    [
                        'role' => 'ccfp_admin',
                        'user_name' => 'Admin User',
                        'user_email' => 'admin@example.com',
                        'updated_at' => now(),
                        'created_at' => now()
                    ]
                );
                $this->info("Set $id as ccfp_admin");
            }
        }

        // Default flow: seed profiles for all auth.users with default role
        $defaultRole = env('SUPABASE_DEFAULT_ROLE', 'org_rep');
        $users = DB::table('auth.users')->select('id', 'email')->get();

        foreach ($users as $u) {
            DB::table('profiles')->updateOrInsert(
                ['user_id' => $u->id],
                [
                    'user_email' => $u->email,
                    'user_name' => $u->email ?? $u->id,
                    'role' => $defaultRole,
                    'updated_at' => now(),
                    'created_at' => now()
                ]
            );
        }

        $this->info('Seeded profiles from auth.users with default role: ' . $defaultRole);
        return 0;
    }
}
