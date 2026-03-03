<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\CompanyApplication;
use App\Models\Resume;
use App\Models\Skill;
use App\Models\User;
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
        foreach (config('resume.skill_catalog', []) as $skillName) {
            Skill::query()->updateOrCreate(
                ['slug' => Str::slug($skillName)],
                [
                    'name' => $skillName,
                    'is_active' => true,
                ],
            );
        }

        User::query()->whereIn('email', [
            'candidate@example.com',
            'test.candidate@example.com',
        ])->delete();

        $recruiter = User::query()->updateOrCreate(
            ['email' => 'priya.menon@talentbridge.demo'],
            [
                'name' => 'Priya Menon',
                'password' => Hash::make('password'),
                'role' => Role::Admin,
                'email_verified_at' => now(),
            ],
        );

        $companyOwnerOne = User::query()->updateOrCreate(
            ['email' => 'ananya.iyer@cloudmosaic.demo'],
            [
                'name' => 'Ananya Iyer',
                'password' => Hash::make('password'),
                'role' => Role::Company,
                'email_verified_at' => now(),
            ],
        );

        $companyOwnerTwo = User::query()->updateOrCreate(
            ['email' => 'rahul.malhotra@zenithpay.demo'],
            [
                'name' => 'Rahul Malhotra',
                'password' => Hash::make('password'),
                'role' => Role::Company,
                'email_verified_at' => now(),
            ],
        );

        $candidateOne = User::query()->updateOrCreate(
            ['email' => 'aarav.sharma@candidate.demo'],
            [
                'name' => 'Aarav Sharma',
                'password' => Hash::make('password'),
                'role' => Role::Candidate,
                'email_verified_at' => now(),
            ],
        );

        $candidateTwo = User::query()->updateOrCreate(
            ['email' => 'nisha.verma@candidate.demo'],
            [
                'name' => 'Nisha Verma',
                'password' => Hash::make('password'),
                'role' => Role::Candidate,
                'email_verified_at' => now(),
            ],
        );

        CandidateProfile::query()->updateOrCreate(
            ['user_id' => $candidateOne->id],
            [
                'phone' => '+91-98765-11001',
                'university' => 'Indian Institute of Technology, Delhi',
                'degree' => 'B.Tech',
                'major' => 'Computer Science and Engineering',
                'cgpa' => 8.71,
                'graduation_year' => 2025,
                'skills' => ['Laravel', 'React', 'PostgreSQL', 'Redis', 'Docker'],
                'bio' => 'Backend-focused engineer with internship experience in fintech APIs and distributed systems.',
                'location' => 'Bengaluru, Karnataka',
                'linkedin_url' => 'https://linkedin.com/in/aarav-sharma-dev',
                'github_url' => 'https://github.com/aarav-sharma-dev',
                'portfolio_url' => 'https://aarav-portfolio.demo',
                'profile_completed_at' => now(),
            ],
        );

        CandidateProfile::query()->updateOrCreate(
            ['user_id' => $candidateTwo->id],
            [
                'phone' => '+91-98765-22002',
                'university' => 'BITS Pilani, Hyderabad Campus',
                'degree' => 'B.E',
                'major' => 'Information Technology',
                'cgpa' => 8.45,
                'graduation_year' => 2024,
                'skills' => ['TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'GraphQL'],
                'bio' => 'Frontend engineer with strong product thinking and experience in high-scale consumer interfaces.',
                'location' => 'Pune, Maharashtra',
                'linkedin_url' => 'https://linkedin.com/in/nisha-verma-ui',
                'github_url' => 'https://github.com/nisha-verma-ui',
                'portfolio_url' => 'https://nisha-ui-portfolio.demo',
                'profile_completed_at' => now(),
            ],
        );

        Resume::query()->updateOrCreate(
            [
                'user_id' => $candidateOne->id,
                'original_name' => 'aarav_sharma_resume.pdf',
            ],
            [
                'file_path' => 'resumes/aarav-sharma-resume.pdf',
                'mime_type' => 'application/pdf',
                'file_size' => 184320,
                'is_primary' => true,
                'extracted_skills' => ['Laravel', 'React', 'PostgreSQL', 'Redis', 'Docker'],
                'raw_text' => 'Aarav Sharma. Backend Engineer profile with Laravel, API design, caching, and SQL optimization experience.',
            ],
        );

        Resume::query()->updateOrCreate(
            [
                'user_id' => $candidateTwo->id,
                'original_name' => 'nisha_verma_resume.pdf',
            ],
            [
                'file_path' => 'resumes/nisha-verma-resume.pdf',
                'mime_type' => 'application/pdf',
                'file_size' => 167936,
                'is_primary' => true,
                'extracted_skills' => ['TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'GraphQL'],
                'raw_text' => 'Nisha Verma. Frontend Engineer profile with React ecosystem, design systems, and performance optimization.',
            ],
        );

        $companyOne = Company::query()->updateOrCreate(
            ['name' => 'CloudMosaic Technologies'],
            [
                'created_by_user_id' => $recruiter->id,
                'owner_user_id' => $companyOwnerOne->id,
                'approved_by_user_id' => $recruiter->id,
                'job_role' => 'Senior Laravel Backend Engineer',
                'website' => 'https://careers.cloudmosaic.demo',
                'location' => 'Bengaluru, Karnataka',
                'description' => 'CloudMosaic builds enterprise workflow automation products for global SaaS customers.',
                'salary_min_lpa' => 18.00,
                'salary_max_lpa' => 28.00,
                'experience_min_years' => 3.0,
                'experience_max_years' => 6.0,
                'employment_type' => 'full_time',
                'work_mode' => 'hybrid',
                'openings' => 4,
                'skills_required' => 'Laravel, PHP 8, MySQL, Redis, AWS',
                'application_deadline' => now()->addDays(35)->toDateString(),
                'source' => 'company',
                'approval_status' => 'approved',
                'visibility' => 'public',
                'is_active' => true,
            ],
        );

        $companyTwo = Company::query()->updateOrCreate(
            ['name' => 'ZenithPay Financial Systems'],
            [
                'created_by_user_id' => $recruiter->id,
                'owner_user_id' => $companyOwnerTwo->id,
                'approved_by_user_id' => $recruiter->id,
                'job_role' => 'Frontend Engineer - React',
                'website' => 'https://jobs.zenithpay.demo',
                'location' => 'Mumbai, Maharashtra',
                'description' => 'ZenithPay delivers modern payment infrastructure and merchant intelligence solutions.',
                'salary_min_lpa' => 14.00,
                'salary_max_lpa' => 22.00,
                'experience_min_years' => 2.0,
                'experience_max_years' => 5.0,
                'employment_type' => 'full_time',
                'work_mode' => 'on_site',
                'openings' => 3,
                'skills_required' => 'React, TypeScript, Tailwind CSS, Jest, REST APIs',
                'application_deadline' => now()->addDays(28)->toDateString(),
                'source' => 'company',
                'approval_status' => 'approved',
                'visibility' => 'public',
                'is_active' => true,
            ],
        );

        $companyThree = Company::query()->updateOrCreate(
            ['name' => 'Northstar Health Labs'],
            [
                'created_by_user_id' => $recruiter->id,
                'approved_by_user_id' => $recruiter->id,
                'job_role' => 'Data Analyst - Product Insights',
                'website' => 'https://careers.northstarhealth.demo',
                'location' => 'Hyderabad, Telangana',
                'description' => 'Northstar Health Labs operates analytics products for preventive healthcare and diagnostics.',
                'salary_min_lpa' => 10.00,
                'salary_max_lpa' => 16.00,
                'experience_min_years' => 1.0,
                'experience_max_years' => 3.0,
                'employment_type' => 'full_time',
                'work_mode' => 'remote',
                'openings' => 5,
                'skills_required' => 'SQL, Python, Power BI, Statistics, A/B Testing',
                'application_deadline' => now()->addDays(22)->toDateString(),
                'source' => 'recruiter',
                'approval_status' => 'approved',
                'visibility' => 'public',
                'is_active' => true,
            ],
        );

        CompanyApplication::query()->updateOrCreate(
            [
                'company_id' => $companyOne->id,
                'candidate_user_id' => $candidateOne->id,
            ],
            [
                'cover_letter' => 'I have 2+ years of Laravel API experience and recently migrated a queue-heavy monolith to scalable workers.',
                'status' => 'submitted',
                'review_note' => null,
                'applied_at' => now()->subDays(3),
            ],
        );

        CompanyApplication::query()->updateOrCreate(
            [
                'company_id' => $companyTwo->id,
                'candidate_user_id' => $candidateTwo->id,
            ],
            [
                'cover_letter' => 'I specialize in React and TypeScript and have built reusable design systems for production products.',
                'status' => 'under_review',
                'review_note' => 'Strong frontend portfolio and communication.',
                'applied_at' => now()->subDays(5),
            ],
        );

        CompanyApplication::query()->updateOrCreate(
            [
                'company_id' => $companyThree->id,
                'candidate_user_id' => $candidateOne->id,
            ],
            [
                'cover_letter' => 'I am interested in data-heavy product roles and have practical SQL dashboarding experience.',
                'status' => 'shortlisted',
                'review_note' => 'Potential fit for analytics pod.',
                'applied_at' => now()->subDays(1),
            ],
        );
    }
}
