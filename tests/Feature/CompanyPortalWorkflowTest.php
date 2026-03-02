<?php

use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\CompanyApplication;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

function createOnboardedCandidateForCompanyPortal(): User
{
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    return $candidate;
}

it('allows company users to create recruitments as pending by default', function () {
    $companyUser = User::factory()->company()->create();

    actingAs($companyUser)
        ->post(route('company.recruitments.store'), [
            'job_role' => 'Backend Engineer Intern',
            'website' => 'https://acme.example',
            'location' => 'New York, USA',
            'description' => 'Entry level backend hiring',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'company-recruitment-created');

    $this->assertDatabaseHas('companies', [
        'job_role' => 'Backend Engineer Intern',
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
        'approval_status' => 'pending',
        'visibility' => 'private',
        'is_active' => 0,
    ]);

    $createdCompany = Company::query()
        ->where('owner_user_id', $companyUser->id)
        ->where('job_role', 'Backend Engineer Intern')
        ->first();

    expect($createdCompany)->not->toBeNull();
    expect($createdCompany?->name)->toContain($companyUser->name);
});

it('allows company owner to edit own recruitment details', function () {
    $companyUser = User::factory()->company()->create();

    $company = Company::factory()->create([
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
        'job_role' => 'Old Role',
        'location' => 'Old Location',
        'description' => 'Old description',
    ]);

    actingAs($companyUser)
        ->patch(route('company.recruitments.update', $company), [
            'job_role' => 'Backend Engineer',
            'website' => 'https://updated.example',
            'location' => 'San Francisco, USA',
            'description' => 'Updated hiring details',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'company-recruitment-updated');

    $this->assertDatabaseHas('companies', [
        'id' => $company->id,
        'job_role' => 'Backend Engineer',
        'website' => 'https://updated.example',
        'location' => 'San Francisco, USA',
        'description' => 'Updated hiring details',
    ]);
});

it('shows recruitment detail page for company owner', function () {
    $companyUser = User::factory()->company()->create();
    $company = Company::factory()->create([
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
        'job_role' => 'Backend Engineer Intern',
    ]);

    actingAs($companyUser)
        ->get(route('company.recruitments.show', $company))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/recruitment-show')
            ->where('recruitment.id', $company->id)
            ->where('recruitment.job_role', 'Backend Engineer Intern')
        );
});

it('redirects to company dashboard after deleting a recruitment', function () {
    $companyUser = User::factory()->company()->create();
    $company = Company::factory()->create([
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
    ]);

    actingAs($companyUser)
        ->delete(route('company.recruitments.destroy', $company))
        ->assertRedirect(route('company.dashboard'))
        ->assertSessionHas('status', 'company-recruitment-deleted');

    $this->assertDatabaseMissing('companies', [
        'id' => $company->id,
    ]);
});

it('allows company owner to update applicant status and role note', function () {
    $companyUser = User::factory()->company()->create();
    $candidate = createOnboardedCandidateForCompanyPortal();

    $company = Company::factory()->create([
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
        'approval_status' => 'approved',
        'visibility' => 'public',
        'is_active' => true,
    ]);

    $application = CompanyApplication::factory()->create([
        'company_id' => $company->id,
        'candidate_user_id' => $candidate->id,
        'status' => 'submitted',
        'review_note' => null,
    ]);

    actingAs($companyUser)
        ->patch(route('company.recruitments.applications.update', [$company, $application]), [
            'status' => 'selected',
            'review_note' => 'Strong communication and API fundamentals.',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'company-application-updated');

    $this->assertDatabaseHas('company_applications', [
        'id' => $application->id,
        'status' => 'selected',
        'review_note' => 'Strong communication and API fundamentals.',
    ]);
});

it('allows recruiter to update applicant status and role note', function () {
    $admin = User::factory()->admin()->create();
    $companyUser = User::factory()->company()->create();
    $candidate = createOnboardedCandidateForCompanyPortal();

    $company = Company::factory()->create([
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
        'approval_status' => 'approved',
        'visibility' => 'public',
        'is_active' => true,
    ]);

    $application = CompanyApplication::factory()->create([
        'company_id' => $company->id,
        'candidate_user_id' => $candidate->id,
        'status' => 'under_review',
        'review_note' => 'Initial company note',
    ]);

    actingAs($admin)
        ->patch(route('recruiter.companies.applications.update', [$company, $application]), [
            'status' => 'accepted',
            'review_note' => 'Recruiter approved for final offer stage.',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'company-application-updated');

    $this->assertDatabaseHas('company_applications', [
        'id' => $application->id,
        'status' => 'accepted',
        'review_note' => 'Recruiter approved for final offer stage.',
    ]);
});

it('allows company owner to view candidate profile for own recruitment application', function () {
    $companyUser = User::factory()->company()->create();
    $candidate = createOnboardedCandidateForCompanyPortal();

    $company = Company::factory()->create([
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
    ]);

    $application = CompanyApplication::factory()->create([
        'company_id' => $company->id,
        'candidate_user_id' => $candidate->id,
    ]);

    actingAs($companyUser)
        ->get(route('company.recruitments.applications.show', [$company, $application]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/application-show')
            ->where('application.id', $application->id)
            ->where('application.candidate.name', $candidate->name)
        );
});

it('rejects invalid application statuses for company updates', function () {
    $companyUser = User::factory()->company()->create();
    $candidate = createOnboardedCandidateForCompanyPortal();

    $company = Company::factory()->create([
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
    ]);

    $application = CompanyApplication::factory()->create([
        'company_id' => $company->id,
        'candidate_user_id' => $candidate->id,
    ]);

    actingAs($companyUser)
        ->patch(route('company.recruitments.applications.update', [$company, $application]), [
            'status' => 'not_a_valid_status',
            'review_note' => 'test',
        ])
        ->assertSessionHasErrors(['status']);
});

it('shows approved company recruitments to candidates', function () {
    $companyUser = User::factory()->company()->create();
    $admin = User::factory()->admin()->create();
    $candidate = createOnboardedCandidateForCompanyPortal();

    $company = Company::factory()->create([
        'name' => 'Public Company Drive',
        'owner_user_id' => $companyUser->id,
        'source' => 'company',
        'approval_status' => 'pending',
        'visibility' => 'private',
        'is_active' => false,
    ]);

    actingAs($admin)
        ->patch(route('recruiter.companies.approve', $company))
        ->assertRedirect();

    actingAs($candidate)
        ->get(route('candidate.companies.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/companies/index')
            ->where('companies.data.0.name', 'Public Company Drive')
        );
});

it('allows company to delete applications only for own recruitments', function () {
    $ownerA = User::factory()->company()->create();
    $ownerB = User::factory()->company()->create();
    $candidate = createOnboardedCandidateForCompanyPortal();

    $companyA = Company::factory()->create([
        'owner_user_id' => $ownerA->id,
        'source' => 'company',
        'approval_status' => 'approved',
        'visibility' => 'public',
        'is_active' => true,
    ]);

    $application = CompanyApplication::factory()->create([
        'company_id' => $companyA->id,
        'candidate_user_id' => $candidate->id,
    ]);

    actingAs($ownerB)
        ->delete(route('company.recruitments.applications.destroy', [$companyA, $application]))
        ->assertForbidden();

    actingAs($ownerA)
        ->delete(route('company.recruitments.applications.destroy', [$companyA, $application]))
        ->assertRedirect()
        ->assertSessionHas('status', 'company-application-deleted');

    $this->assertDatabaseMissing('company_applications', [
        'id' => $application->id,
    ]);
});
