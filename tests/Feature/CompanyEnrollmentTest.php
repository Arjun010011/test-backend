<?php

use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\CompanyApplication;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

function createOnboardedCandidate(): User
{
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    return $candidate;
}

it('allows admin users to enroll companies', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('recruiter.companies.store'), [
            'name' => 'Acme Tech',
            'website' => 'https://acme.example',
            'location' => 'Bengaluru, India',
            'description' => 'Product engineering company.',
            'is_active' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'company-enrolled');

    $this->assertDatabaseHas('companies', [
        'name' => 'Acme Tech',
        'location' => 'Bengaluru, India',
        'is_active' => 1,
    ]);
});

it('shows enrolled companies to candidates', function () {
    $candidate = createOnboardedCandidate();

    Company::factory()->create([
        'name' => 'Visible Labs',
        'is_active' => true,
    ]);

    Company::factory()->create([
        'name' => 'Hidden Labs',
        'is_active' => false,
    ]);

    actingAs($candidate)
        ->get(route('candidate.companies.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/companies/index')
            ->has('companies.data', 1)
            ->where('companies.data.0.name', 'Visible Labs')
            ->where('companies.data.0.has_applied', false)
        );
});

it('allows candidate to apply to a company only once', function () {
    $candidate = createOnboardedCandidate();
    $company = Company::factory()->create(['is_active' => true]);

    actingAs($candidate)
        ->post(route('candidate.companies.apply', $company), [
            'cover_letter' => 'I am interested in backend roles.',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'company-application-submitted');

    actingAs($candidate)
        ->post(route('candidate.companies.apply', $company), [
            'cover_letter' => 'Second attempt',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'company-application-exists');

    expect(CompanyApplication::query()
        ->where('company_id', $company->id)
        ->where('candidate_user_id', $candidate->id)
        ->count())->toBe(1);
});

it('blocks candidate users from recruiter company enrollment routes', function () {
    $candidate = createOnboardedCandidate();

    actingAs($candidate)
        ->post(route('recruiter.companies.store'), [
            'name' => 'Unauthorized Co',
        ])
        ->assertForbidden();
});

it('shows applications for a recruiter company detail page', function () {
    $admin = User::factory()->admin()->create();
    $candidate = createOnboardedCandidate();
    $company = Company::factory()->create([
        'created_by_user_id' => $admin->id,
        'name' => 'Grow Fast Labs',
    ]);

    CompanyApplication::factory()->create([
        'company_id' => $company->id,
        'candidate_user_id' => $candidate->id,
        'cover_letter' => 'I would love to join your backend team.',
    ]);

    actingAs($admin)
        ->get(route('recruiter.companies.show', $company))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/companies/show')
            ->where('company.name', 'Grow Fast Labs')
            ->has('applications.data', 1)
            ->where('applications.data.0.candidate.name', $candidate->name)
        );
});

it('shows recruiter company application details', function () {
    $admin = User::factory()->admin()->create();
    $candidate = createOnboardedCandidate();
    $company = Company::factory()->create([
        'created_by_user_id' => $admin->id,
        'name' => 'Orbit Tech',
    ]);

    $application = CompanyApplication::factory()->create([
        'company_id' => $company->id,
        'candidate_user_id' => $candidate->id,
        'cover_letter' => 'Looking forward to contributing to your platform.',
    ]);

    actingAs($admin)
        ->get(route('recruiter.companies.applications.show', [$company, $application]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/companies/application-show')
            ->where('company.name', 'Orbit Tech')
            ->where('application.id', $application->id)
            ->where('application.candidate.name', $candidate->name)
        );
});

it('prevents opening an application with an unrelated company route', function () {
    $admin = User::factory()->admin()->create();
    $candidate = createOnboardedCandidate();

    $correctCompany = Company::factory()->create(['created_by_user_id' => $admin->id]);
    $wrongCompany = Company::factory()->create(['created_by_user_id' => $admin->id]);

    $application = CompanyApplication::factory()->create([
        'company_id' => $correctCompany->id,
        'candidate_user_id' => $candidate->id,
    ]);

    actingAs($admin)
        ->get(route('recruiter.companies.applications.show', [$wrongCompany, $application]))
        ->assertNotFound();
});

it('filters registered companies in recruiter listing', function () {
    $admin = User::factory()->admin()->create();

    Company::factory()->create([
        'name' => 'Filter Match Labs',
        'source' => 'company',
        'approval_status' => 'approved',
        'visibility' => 'public',
        'salary_min_lpa' => 8.5,
        'salary_max_lpa' => 14.0,
        'experience_min_years' => 1.0,
        'experience_max_years' => 3.0,
        'employment_type' => 'full_time',
        'work_mode' => 'hybrid',
        'openings' => 4,
        'skills_required' => 'Laravel, React',
        'application_deadline' => '2026-04-15',
    ]);

    Company::factory()->create([
        'name' => 'Other Recruiter Entry',
        'source' => 'recruiter',
        'approval_status' => 'pending',
        'visibility' => 'private',
    ]);

    actingAs($admin)
        ->get(route('recruiter.companies.index', [
            'search' => 'Filter Match',
            'source' => 'company',
            'visibility' => 'public',
            'approval_status' => 'approved',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/companies/index')
            ->has('companies.data', 1)
            ->where('companies.data.0.name', 'Filter Match Labs')
            ->where('companies.data.0.salary_min_lpa', 8.5)
            ->where('companies.data.0.salary_max_lpa', 14)
            ->where('companies.data.0.experience_min_years', 1)
            ->where('companies.data.0.experience_max_years', 3)
            ->where('companies.data.0.employment_type', 'full_time')
            ->where('companies.data.0.work_mode', 'hybrid')
            ->where('companies.data.0.openings', 4)
            ->where('companies.data.0.skills_required', 'Laravel, React')
            ->where('companies.data.0.application_deadline', '2026-04-15')
            ->where('filters.search', 'Filter Match')
            ->where('filters.source', 'company')
            ->where('filters.visibility', 'public')
            ->where('filters.approval_status', 'approved')
        );
});
