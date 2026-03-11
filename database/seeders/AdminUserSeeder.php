<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::factory()->create([
            'name' => 'Admin',
            'email' => 'receptionist@deped.gov.ph',
            'password' => bcrypt('admin1!'),
            'is_admin' => true,
            'is_approved' => true,
        ]);
    }
}
