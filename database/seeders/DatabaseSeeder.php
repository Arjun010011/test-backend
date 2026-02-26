<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $candidate = \App\Models\User::factory()->candidate()->create([
            'name' => 'Test Candidate',
            'email' => 'candidate@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        \App\Models\CandidateProfile::factory()->create([
            'user_id' => $candidate->id,
            'skills' => ['React', 'Laravel', 'Tailwind CSS'],
        ]);

        \App\Models\Resume::factory()->create([
            'user_id' => $candidate->id,
            'file_path' => 'resumes/sample.pdf',
            'original_name' => 'sample_resume.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 102400, // 100KB
            'is_primary' => true,
            'extracted_skills' => ['React', 'Laravel', 'Tailwind CSS'],
            'raw_text' => 'Sample resume text containing React and Laravel skills.',
        ]);
    }
}