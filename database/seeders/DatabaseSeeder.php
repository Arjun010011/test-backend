<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentProctoringEvent;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentQuestionOption;
use App\Models\AssessmentResponse;
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
        AssessmentProctoringEvent::query()->delete();
        AssessmentResponse::query()->delete();
        AssessmentAttempt::query()->delete();
        AssessmentQuestionOption::query()->delete();
        AssessmentQuestion::query()->delete();
        Assessment::withTrashed()->get()->each(fn (Assessment $assessment): bool => (bool) $assessment->forceDelete());
        CompanyApplication::query()->delete();
        Company::query()->delete();
        Resume::query()->delete();
        CandidateProfile::query()->delete();
        User::query()->whereIn('role', [Role::Candidate, Role::Company, Role::Admin])->delete();

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

        User::query()
            ->where('email', 'like', '%.demo')
            ->delete();

        User::query()
            ->where('role', Role::Candidate)
            ->where(function ($query): void {
                $query
                    ->where('email', 'like', '%demo%')
                    ->orWhere('email', 'like', '%@campushire.test')
                    ->orWhere('name', 'like', '%Demo%');
            })
            ->delete();

        $recruiter = User::query()->updateOrCreate(
            ['email' => 'priya.menon@talentbridge.io'],
            [
                'name' => 'Priya Menon',
                'password' => Hash::make('password'),
                'role' => Role::Admin,
                'email_verified_at' => now(),
            ],
        );

        $companyOwnerOne = User::query()->updateOrCreate(
            ['email' => 'ananya.iyer@cloudmosaictech.com'],
            [
                'name' => 'Ananya Iyer',
                'password' => Hash::make('password'),
                'role' => Role::Company,
                'email_verified_at' => now(),
            ],
        );

        $companyOwnerTwo = User::query()->updateOrCreate(
            ['email' => 'rahul.malhotra@zenithpay.com'],
            [
                'name' => 'Rahul Malhotra',
                'password' => Hash::make('password'),
                'role' => Role::Company,
                'email_verified_at' => now(),
            ],
        );

        $candidateOne = User::query()->updateOrCreate(
            ['email' => 'aarav.sharma@gmail.com'],
            [
                'name' => 'Aarav Sharma',
                'password' => Hash::make('password'),
                'role' => Role::Candidate,
                'email_verified_at' => now(),
            ],
        );

        $candidateTwo = User::query()->updateOrCreate(
            ['email' => 'nisha.verma@gmail.com'],
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
                'skill_categories' => [
                    'Backend Development' => ['Laravel', 'PostgreSQL', 'Redis'],
                    'Frontend Development' => ['React'],
                    'DevOps & Cloud' => ['Docker'],
                ],
                'bio' => 'Backend-focused engineer with internship experience in fintech APIs and distributed systems.',
                'achievements' => 'Finalist in Smart India Hackathon 2024, built an API reliability dashboard used by 3 internal teams.',
                'hackathons_experience' => 'Participated in 4 hackathons; led backend architecture and deployment automation in 2 winning teams.',
                'projects_description' => 'Built a job-matching platform with Laravel queues, Redis caching, and real-time recruiter collaboration.',
                'location' => 'Bengaluru, Karnataka',
                'address_line_1' => 'No. 48, 3rd Cross, Indiranagar',
                'address_line_2' => 'Near 100 Feet Road',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'district' => 'Bengaluru Urban',
                'country' => 'India',
                'postal_code' => '560038',
                'linkedin_url' => 'https://linkedin.com/in/aarav-sharma-dev',
                'github_url' => 'https://github.com/aarav-sharma-dev',
                'portfolio_url' => 'https://aaravsharma.dev',
                'candidate_status' => 'shortlisted',
                'is_currently_studying' => false,
                'current_semester' => null,
                'total_semesters' => 8,
                'semester_recorded_at' => now()->subMonths(10)->toDateString(),
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
                'skill_categories' => [
                    'Frontend Development' => ['TypeScript', 'Next.js', 'Tailwind CSS'],
                    'Backend Development' => ['Node.js', 'GraphQL'],
                ],
                'bio' => 'Frontend engineer with strong product thinking and experience in high-scale consumer interfaces.',
                'achievements' => 'Built an accessibility-first design system that reduced UI bug reports by 35% across three releases.',
                'hackathons_experience' => 'Top 5 placement in a national UI innovation challenge with a real-time collaboration prototype.',
                'projects_description' => 'Developed a multi-tenant analytics dashboard using Next.js, GraphQL, and role-based data controls.',
                'location' => 'Pune, Maharashtra',
                'address_line_1' => 'Flat 1203, Emerald Residency, Baner',
                'address_line_2' => 'Opp. Balewadi High Street',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'district' => 'Pune',
                'country' => 'India',
                'postal_code' => '411045',
                'linkedin_url' => 'https://linkedin.com/in/nisha-verma-ui',
                'github_url' => 'https://github.com/nisha-verma-ui',
                'portfolio_url' => 'https://nishaverma.dev',
                'candidate_status' => 'in_review',
                'is_currently_studying' => false,
                'current_semester' => null,
                'total_semesters' => 8,
                'semester_recorded_at' => now()->subYear()->toDateString(),
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

        $additionalCandidates = [
            [
                'name' => 'Rohan Kulkarni',
                'email' => 'rohan.kulkarni@gmail.com',
                'phone' => '+91-98111-30011',
                'university' => 'VIT Vellore',
                'degree' => 'B.Tech',
                'major' => 'Information Technology',
                'cgpa' => 8.32,
                'graduation_year' => 2024,
                'skills' => ['Java', 'Spring Boot', 'MySQL', 'Docker'],
                'skill_categories' => [
                    'Backend Development' => ['Java', 'Spring Boot', 'MySQL'],
                    'DevOps & Cloud' => ['Docker'],
                ],
                'bio' => 'Backend engineer focused on Java microservices and API performance.',
                'achievements' => 'Won inter-college coding challenge for distributed system design.',
                'hackathons_experience' => 'Built a logistics route optimizer in a 36-hour hackathon.',
                'projects_description' => 'Developed order management APIs with Spring Boot and MySQL.',
                'location' => 'Chennai, Tamil Nadu',
                'address_line_1' => '12, 2nd Main Road, T Nagar',
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'district' => 'Chennai',
                'country' => 'India',
                'postal_code' => '600017',
                'linkedin_url' => 'https://linkedin.com/in/rohan-kulkarni-dev',
                'github_url' => 'https://github.com/rohan-kulkarni-dev',
                'portfolio_url' => 'https://rohankulkarni.dev',
                'candidate_status' => 'new',
                'resume_name' => 'rohan_kulkarni_resume.pdf',
                'resume_path' => 'resumes/rohan-kulkarni-resume.pdf',
            ],
            [
                'name' => 'Meera Nair',
                'email' => 'meera.nair@gmail.com',
                'phone' => '+91-98222-41122',
                'university' => 'NIT Calicut',
                'degree' => 'B.Tech',
                'major' => 'Computer Science',
                'cgpa' => 8.64,
                'graduation_year' => 2025,
                'skills' => ['React', 'TypeScript', 'Redux', 'Tailwind CSS'],
                'skill_categories' => [
                    'Frontend Development' => ['React', 'TypeScript', 'Redux', 'Tailwind CSS'],
                ],
                'bio' => 'Frontend engineer with experience in design systems and accessibility.',
                'achievements' => 'Led UI overhaul that improved Lighthouse accessibility to 96.',
                'hackathons_experience' => 'Runner-up in UX innovation sprint hosted by startup incubator.',
                'projects_description' => 'Built reusable component libraries and dashboard interfaces.',
                'location' => 'Kochi, Kerala',
                'address_line_1' => '44, Marine Drive Residency',
                'city' => 'Kochi',
                'state' => 'Kerala',
                'district' => 'Ernakulam',
                'country' => 'India',
                'postal_code' => '682031',
                'linkedin_url' => 'https://linkedin.com/in/meera-nair-ui',
                'github_url' => 'https://github.com/meera-nair-ui',
                'portfolio_url' => 'https://meeranair.dev',
                'candidate_status' => 'in_review',
                'resume_name' => 'meera_nair_resume.pdf',
                'resume_path' => 'resumes/meera-nair-resume.pdf',
            ],
            [
                'name' => 'Karan Bhatia',
                'email' => 'karan.bhatia@gmail.com',
                'phone' => '+91-98333-52233',
                'university' => 'Delhi Technological University',
                'degree' => 'B.Tech',
                'major' => 'Software Engineering',
                'cgpa' => 8.11,
                'graduation_year' => 2023,
                'skills' => ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
                'skill_categories' => [
                    'Backend Development' => ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
                ],
                'bio' => 'Python backend engineer with async APIs and caching experience.',
                'achievements' => 'Built interview scheduling bot reducing manual operations by 40%.',
                'hackathons_experience' => 'Developed AI-based resume screening prototype in hack weekend.',
                'projects_description' => 'Created candidate scoring service with FastAPI and Redis.',
                'location' => 'New Delhi, Delhi',
                'address_line_1' => 'B-129, Sector 14, Dwarka',
                'city' => 'New Delhi',
                'state' => 'Delhi',
                'district' => 'South West Delhi',
                'country' => 'India',
                'postal_code' => '110078',
                'linkedin_url' => 'https://linkedin.com/in/karan-bhatia-dev',
                'github_url' => 'https://github.com/karan-bhatia-dev',
                'portfolio_url' => 'https://karanbhatia.dev',
                'candidate_status' => 'shortlisted',
                'resume_name' => 'karan_bhatia_resume.pdf',
                'resume_path' => 'resumes/karan-bhatia-resume.pdf',
            ],
            [
                'name' => 'Pooja Deshpande',
                'email' => 'pooja.deshpande@gmail.com',
                'phone' => '+91-98444-63344',
                'university' => 'COEP Technological University',
                'degree' => 'B.E',
                'major' => 'Computer Engineering',
                'cgpa' => 8.52,
                'graduation_year' => 2024,
                'skills' => ['Node.js', 'Express', 'MongoDB', 'GraphQL'],
                'skill_categories' => [
                    'Backend Development' => ['Node.js', 'Express', 'MongoDB', 'GraphQL'],
                ],
                'bio' => 'Full-stack developer with strong backend API design focus.',
                'achievements' => 'Mentored 20+ juniors in web development club.',
                'hackathons_experience' => 'Built telemedicine booking app prototype for rural clinics.',
                'projects_description' => 'Delivered GraphQL APIs for healthcare scheduling workflows.',
                'location' => 'Pune, Maharashtra',
                'address_line_1' => '18, Prabhat Road, Deccan',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'district' => 'Pune',
                'country' => 'India',
                'postal_code' => '411004',
                'linkedin_url' => 'https://linkedin.com/in/pooja-deshpande-dev',
                'github_url' => 'https://github.com/pooja-deshpande-dev',
                'portfolio_url' => 'https://poojadeshpande.dev',
                'candidate_status' => 'new',
                'resume_name' => 'pooja_deshpande_resume.pdf',
                'resume_path' => 'resumes/pooja-deshpande-resume.pdf',
            ],
            [
                'name' => 'Aditya Rao',
                'email' => 'aditya.rao@gmail.com',
                'phone' => '+91-98555-74455',
                'university' => 'Manipal Institute of Technology',
                'degree' => 'B.Tech',
                'major' => 'Computer Science and Engineering',
                'cgpa' => 8.27,
                'graduation_year' => 2025,
                'skills' => ['AWS', 'Terraform', 'Kubernetes', 'CI/CD'],
                'skill_categories' => [
                    'DevOps & Cloud' => ['AWS', 'Terraform', 'Kubernetes', 'CI/CD'],
                ],
                'bio' => 'Cloud and DevOps engineer focused on reliability and automation.',
                'achievements' => 'Implemented CI/CD templates reused by 6 student project teams.',
                'hackathons_experience' => 'Built serverless deployment toolkit in cloud innovation challenge.',
                'projects_description' => 'Automated infra provisioning with Terraform and GitHub Actions.',
                'location' => 'Mangaluru, Karnataka',
                'address_line_1' => '72, Kadri Main Road',
                'city' => 'Mangaluru',
                'state' => 'Karnataka',
                'district' => 'Dakshina Kannada',
                'country' => 'India',
                'postal_code' => '575002',
                'linkedin_url' => 'https://linkedin.com/in/aditya-rao-cloud',
                'github_url' => 'https://github.com/aditya-rao-cloud',
                'portfolio_url' => 'https://adityarao.dev',
                'candidate_status' => 'in_review',
                'resume_name' => 'aditya_rao_resume.pdf',
                'resume_path' => 'resumes/aditya-rao-resume.pdf',
            ],
            [
                'name' => 'Sneha Kapoor',
                'email' => 'sneha.kapoor@gmail.com',
                'phone' => '+91-98666-85566',
                'university' => 'Amity University Noida',
                'degree' => 'B.Tech',
                'major' => 'Data Science',
                'cgpa' => 8.74,
                'graduation_year' => 2024,
                'skills' => ['Python', 'Pandas', 'SQL', 'Power BI'],
                'skill_categories' => [
                    'Data & Analytics' => ['Python', 'Pandas', 'SQL', 'Power BI'],
                ],
                'bio' => 'Data analyst with reporting automation and experimentation experience.',
                'achievements' => 'Created sales analytics dashboard used in capstone partner company.',
                'hackathons_experience' => 'Participated in national analytics challenge with churn prediction model.',
                'projects_description' => 'Built customer cohort analysis and KPI monitoring dashboards.',
                'location' => 'Noida, Uttar Pradesh',
                'address_line_1' => 'Tower 8, Sector 62',
                'city' => 'Noida',
                'state' => 'Uttar Pradesh',
                'district' => 'Gautam Buddha Nagar',
                'country' => 'India',
                'postal_code' => '201309',
                'linkedin_url' => 'https://linkedin.com/in/sneha-kapoor-analytics',
                'github_url' => 'https://github.com/sneha-kapoor-analytics',
                'portfolio_url' => 'https://snehakapoor.dev',
                'candidate_status' => 'shortlisted',
                'resume_name' => 'sneha_kapoor_resume.pdf',
                'resume_path' => 'resumes/sneha-kapoor-resume.pdf',
            ],
        ];

        foreach ($additionalCandidates as $candidateData) {
            $candidate = User::query()->updateOrCreate(
                ['email' => $candidateData['email']],
                [
                    'name' => $candidateData['name'],
                    'password' => Hash::make('password'),
                    'role' => Role::Candidate,
                    'email_verified_at' => now(),
                ],
            );

            CandidateProfile::query()->updateOrCreate(
                ['user_id' => $candidate->id],
                [
                    'phone' => $candidateData['phone'],
                    'university' => $candidateData['university'],
                    'degree' => $candidateData['degree'],
                    'major' => $candidateData['major'],
                    'cgpa' => $candidateData['cgpa'],
                    'graduation_year' => $candidateData['graduation_year'],
                    'skills' => $candidateData['skills'],
                    'skill_categories' => $candidateData['skill_categories'],
                    'bio' => $candidateData['bio'],
                    'achievements' => $candidateData['achievements'],
                    'hackathons_experience' => $candidateData['hackathons_experience'],
                    'projects_description' => $candidateData['projects_description'],
                    'location' => $candidateData['location'],
                    'address_line_1' => $candidateData['address_line_1'],
                    'address_line_2' => null,
                    'city' => $candidateData['city'],
                    'state' => $candidateData['state'],
                    'district' => $candidateData['district'],
                    'country' => $candidateData['country'],
                    'postal_code' => $candidateData['postal_code'],
                    'linkedin_url' => $candidateData['linkedin_url'],
                    'github_url' => $candidateData['github_url'],
                    'portfolio_url' => $candidateData['portfolio_url'],
                    'candidate_status' => $candidateData['candidate_status'],
                    'is_currently_studying' => false,
                    'current_semester' => null,
                    'total_semesters' => 8,
                    'semester_recorded_at' => now()->subYear()->toDateString(),
                    'profile_completed_at' => now(),
                ],
            );

            Resume::query()->updateOrCreate(
                [
                    'user_id' => $candidate->id,
                    'original_name' => $candidateData['resume_name'],
                ],
                [
                    'file_path' => $candidateData['resume_path'],
                    'mime_type' => 'application/pdf',
                    'file_size' => 172032,
                    'is_primary' => true,
                    'extracted_skills' => $candidateData['skills'],
                    'raw_text' => $candidateData['name'].' profile with '.implode(', ', $candidateData['skills']).' and project delivery experience.',
                ],
            );
        }

        $companyOne = Company::query()->updateOrCreate(
            ['name' => 'CloudMosaic Technologies'],
            [
                'created_by_user_id' => $recruiter->id,
                'owner_user_id' => $companyOwnerOne->id,
                'approved_by_user_id' => $recruiter->id,
                'job_role' => 'Senior Laravel Backend Engineer',
                'website' => 'https://careers.cloudmosaictech.com',
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
                'website' => 'https://jobs.zenithpay.com',
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
                'website' => 'https://careers.northstarhealthlabs.com',
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

        $assessmentOne = Assessment::query()->create([
            'created_by' => $recruiter->id,
            'title' => 'Backend Engineering Screening',
            'description' => 'Core backend fundamentals for API, database, and scalability concepts.',
            'category' => 'backend_engineering',
            'difficulty' => 'mixed',
            'duration_minutes' => 45,
            'total_questions' => 5,
            'passing_score' => 60,
            'randomize_questions' => false,
            'show_results_immediately' => true,
            'status' => 'active',
            'is_active' => true,
            'published_at' => now()->subDays(3),
        ]);

        $assessmentTwo = Assessment::query()->create([
            'created_by' => $recruiter->id,
            'title' => 'Frontend React Assessment',
            'description' => 'Practical evaluation of React, TypeScript, and browser performance basics.',
            'category' => 'frontend_engineering',
            'difficulty' => 'mixed',
            'duration_minutes' => 40,
            'total_questions' => 5,
            'passing_score' => 60,
            'randomize_questions' => false,
            'show_results_immediately' => true,
            'status' => 'active',
            'is_active' => true,
            'published_at' => now()->subDays(2),
        ]);

        $createQuestion = function (Assessment $assessment, string $text, string $difficulty, int $points, array $options, int $correctIndex): AssessmentQuestion {
            $question = $assessment->questions()->create([
                'question_text' => $text,
                'question_type' => 'multiple_choice',
                'category' => $assessment->category,
                'difficulty' => $difficulty,
                'points' => $points,
                'source' => 'seeded_demo',
            ]);

            foreach ($options as $index => $optionText) {
                $question->options()->create([
                    'option_text' => $optionText,
                    'is_correct' => $index === $correctIndex,
                    'display_order' => $index + 1,
                ]);
            }

            return $question;
        };

        $backendQuestions = [
            $createQuestion($assessmentOne, 'Which HTTP method is idempotent by definition?', 'easy', 1, ['POST', 'PATCH', 'DELETE', 'PUT'], 3),
            $createQuestion($assessmentOne, 'Which index type is best for exact-match lookups in SQL?', 'easy', 1, ['B-Tree', 'Full-text', 'Hash map in app memory', 'Bitmap'], 0),
            $createQuestion($assessmentOne, 'What is the main benefit of using Redis in API-heavy systems?', 'medium', 2, ['Persistent object storage', 'Low-latency caching', 'Relational joins', 'Schema migration'], 1),
            $createQuestion($assessmentOne, 'Which pattern prevents duplicated queue job processing?', 'medium', 2, ['Fire-and-forget', 'Idempotency key', 'Round-robin', 'Polling'], 1),
            $createQuestion($assessmentOne, 'What is most likely to cause an N+1 query issue?', 'hard', 3, ['Eager loading relationships', 'Lazy loading in loops', 'Using indexes', 'Batch inserts'], 1),
        ];

        $frontendQuestions = [
            $createQuestion($assessmentTwo, 'What does React use to identify list elements efficiently?', 'easy', 1, ['Refs', 'Keys', 'State IDs', 'Props spread'], 1),
            $createQuestion($assessmentTwo, 'In TypeScript, which type is safer than any for unknown input?', 'easy', 1, ['unknown', 'never', 'void', 'object'], 0),
            $createQuestion($assessmentTwo, 'Which hook memoizes a computed value?', 'medium', 2, ['useEffect', 'useMemo', 'useRef', 'useState'], 1),
            $createQuestion($assessmentTwo, 'What helps reduce bundle size in SPA apps?', 'medium', 2, ['Inline all dependencies', 'Code splitting', 'Disable tree shaking', 'Use larger images'], 1),
            $createQuestion($assessmentTwo, 'Which issue is most related to stale closures?', 'hard', 3, ['Incorrect CSS specificity', 'Old state in async callback', 'Slow DNS lookups', 'Database deadlocks'], 1),
        ];

        $saveSubmittedAttempt = function (User $candidate, Assessment $assessment, array $questions, array $selectedOptionIndexes, int $minutesAgo): void {
            $attempt = AssessmentAttempt::query()->create([
                'assessment_id' => $assessment->id,
                'candidate_id' => $candidate->id,
                'assignment_id' => null,
                'attempt_number' => 1,
                'started_at' => now()->subMinutes($minutesAgo + 35),
                'max_score' => (int) $assessment->questions()->sum('points'),
                'status' => 'in_progress',
            ]);

            foreach ($questions as $questionIndex => $question) {
                $selectedOption = $question->options()->orderBy('display_order')->get()[$selectedOptionIndexes[$questionIndex] ?? 0];

                AssessmentResponse::query()->create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'selected_option_id' => $selectedOption->id,
                    'is_correct' => $selectedOption->is_correct,
                    'points_earned' => $selectedOption->is_correct ? $question->points : 0,
                ]);
            }

            $attempt->calculateScore();
            $attempt->forceFill([
                'submitted_at' => now()->subMinutes($minutesAgo),
                'time_taken_seconds' => 35 * 60,
                'status' => 'submitted',
                'answers_snapshot' => $attempt->responses()->with(['question', 'selectedOption'])->get()->toArray(),
            ])->save();
        };

        $saveSubmittedAttempt($candidateOne, $assessmentOne, $backendQuestions, [3, 0, 1, 1, 1], 220);
        $saveSubmittedAttempt($candidateTwo, $assessmentTwo, $frontendQuestions, [1, 0, 1, 2, 1], 160);

        $rohan = User::query()->where('email', 'rohan.kulkarni@gmail.com')->first();
        $meera = User::query()->where('email', 'meera.nair@gmail.com')->first();
        $karan = User::query()->where('email', 'karan.bhatia@gmail.com')->first();
        $pooja = User::query()->where('email', 'pooja.deshpande@gmail.com')->first();
        $aditya = User::query()->where('email', 'aditya.rao@gmail.com')->first();
        $sneha = User::query()->where('email', 'sneha.kapoor@gmail.com')->first();

        if ($rohan !== null) {
            $saveSubmittedAttempt($rohan, $assessmentOne, $backendQuestions, [3, 0, 2, 1, 1], 130);
        }

        if ($meera !== null) {
            $saveSubmittedAttempt($meera, $assessmentTwo, $frontendQuestions, [1, 0, 1, 1, 0], 95);
        }

        if ($karan !== null) {
            $saveSubmittedAttempt($karan, $assessmentOne, $backendQuestions, [1, 0, 1, 1, 1], 80);
        }

        if ($pooja !== null) {
            $saveSubmittedAttempt($pooja, $assessmentTwo, $frontendQuestions, [1, 3, 1, 1, 1], 60);
        }

        if ($aditya !== null) {
            $saveSubmittedAttempt($aditya, $assessmentOne, $backendQuestions, [3, 0, 1, 1, 0], 45);
        }

        if ($sneha !== null) {
            $saveSubmittedAttempt($sneha, $assessmentTwo, $frontendQuestions, [1, 0, 2, 1, 1], 25);
        }
    }
}
