<?php

namespace Database\Seeders;

use App\Models\Skill;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach (config('resume.skill_catalog', []) as $skillName) {
            Skill::query()->updateOrCreate(
                ['slug' => Str::slug($skillName)],
                [
                    'name' => $skillName,
                    'is_active' => true,
                ],
            );
        }

        $candidate = \App\Models\User::query()->updateOrCreate(
            ['email' => 'candidate@example.com'],
            [
                'name' => 'Test Candidate',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => \App\Enums\Role::Candidate,
                'email_verified_at' => now(),
            ],
        );

        \App\Models\CandidateProfile::query()->updateOrCreate(
            ['user_id' => $candidate->id],
            [
                'skills' => ['React', 'Laravel', 'Tailwind CSS'],
                'profile_completed_at' => now(),
            ],
        );

        \App\Models\Resume::query()->updateOrCreate(
            [
                'user_id' => $candidate->id,
                'original_name' => 'sample_resume.pdf',
            ],
            [
                'file_path' => 'resumes/sample.pdf',
                'mime_type' => 'application/pdf',
                'file_size' => 102400, // 100KB
                'is_primary' => true,
                'extracted_skills' => ['React', 'Laravel', 'Tailwind CSS'],
                'raw_text' => 'Sample resume text containing React and Laravel skills.',
            ],
        );
    }
}
