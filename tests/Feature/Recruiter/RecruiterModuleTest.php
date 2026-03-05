<?php

use App\Enums\CandidateStatus;
use App\Models\CandidateProfile;
use App\Models\CandidateWorkflowStatus;
use App\Models\Company;
use App\Models\CompanyApplication;
use App\Models\RecruiterCollection;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

function recruiterStorageDisk(): string
{
    return (string) config('resume.storage_disk', config('filesystems.default', 'local'));
}

it('blocks non-admin users from recruiter routes', function () {
    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->get(route('recruiter.dashboard'))
        ->assertForbidden();
});

it('shows recruiter analytics page', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    $company = Company::factory()->create([
        'is_active' => true,
        'created_by_user_id' => $admin->id,
    ]);

    CompanyApplication::factory()->create([
        'company_id' => $company->id,
        'candidate_user_id' => $candidate->id,
        'status' => 'submitted',
    ]);

    actingAs($admin)
        ->get(route('recruiter.analytics'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/analytics')
            ->where('summary.companies', 1)
            ->where('summary.applications', 1)
            ->where('breakdown.applications_by_status.0.status', 'submitted')
        );
});

it('allows recruiters to create global custom candidate statuses', function () {
    $adminA = User::factory()->admin()->create();
    $adminB = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    actingAs($adminA)
        ->post(route('recruiter.statuses.store'), [
            'label' => 'Technical Round',
            'color' => 'cyan',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('candidate_workflow_statuses', [
        'key' => 'technical_round',
        'label' => 'Technical Round',
    ]);

    $response = actingAs($adminB)
        ->get(route('recruiter.candidates.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('recruiter/candidates/index'));

    expect(collect($response->inertiaProps('statuses'))->pluck('value')->all())
        ->toContain(
            CandidateWorkflowStatus::query()
                ->where('label', 'Technical Round')
                ->firstOrFail()
                ->key
        );
});

it('allows recruiters to edit global custom candidate statuses', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();
    $status = CandidateWorkflowStatus::query()->create([
        'key' => 'screening_round',
        'label' => 'Screening Round',
        'color' => 'gray',
        'is_default' => false,
        'created_by_user_id' => $admin->id,
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
        'candidate_status' => $status->key,
    ]);

    actingAs($admin)
        ->patch(route('recruiter.statuses.update', $status), [
            'label' => 'Final Interview',
            'color' => 'blue',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('candidate_workflow_statuses', [
        'id' => $status->id,
        'key' => 'final_interview',
        'label' => 'Final Interview',
        'color' => 'blue',
    ]);

    $this->assertDatabaseHas('candidate_profiles', [
        'user_id' => $candidate->id,
        'candidate_status' => 'final_interview',
    ]);

    $response = actingAs($admin)
        ->get(route('recruiter.candidates.index'))
        ->assertSuccessful();

    $updatedStatus = collect($response->inertiaProps('statuses'))
        ->firstWhere('value', 'final_interview');

    expect($updatedStatus)->not->toBeNull()
        ->and($updatedStatus['color'])->toBe('blue');
});

it('allows recruiters to delete global custom candidate statuses', function () {
    $admin = User::factory()->admin()->create();
    $status = CandidateWorkflowStatus::query()->create([
        'key' => 'to_archive',
        'label' => 'To Archive',
        'color' => 'gray',
        'is_default' => false,
        'created_by_user_id' => $admin->id,
    ]);

    actingAs($admin)
        ->delete(route('recruiter.statuses.destroy', $status))
        ->assertRedirect();

    $this->assertDatabaseMissing('candidate_workflow_statuses', [
        'id' => $status->id,
    ]);
});

it('allows deleting custom status when only non-candidate profiles use it', function () {
    $admin = User::factory()->admin()->create();
    $anotherAdmin = User::factory()->admin()->create();
    $status = CandidateWorkflowStatus::query()->create([
        'key' => 'internal_hold',
        'label' => 'Internal Hold',
        'color' => 'gray',
        'is_default' => false,
        'created_by_user_id' => $admin->id,
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $anotherAdmin->id,
        'candidate_status' => $status->key,
    ]);

    actingAs($admin)
        ->delete(route('recruiter.statuses.destroy', $status))
        ->assertRedirect();

    $this->assertDatabaseMissing('candidate_workflow_statuses', [
        'id' => $status->id,
    ]);
});

it('allows deleting custom status when only incomplete candidate profiles use it', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();
    $status = CandidateWorkflowStatus::query()->create([
        'key' => 'screening_hold',
        'label' => 'Screening Hold',
        'color' => 'gray',
        'is_default' => false,
        'created_by_user_id' => $admin->id,
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => null,
        'candidate_status' => $status->key,
    ]);

    actingAs($admin)
        ->delete(route('recruiter.statuses.destroy', $status))
        ->assertRedirect();

    $this->assertDatabaseMissing('candidate_workflow_statuses', [
        'id' => $status->id,
    ]);

    $this->assertDatabaseHas('candidate_profiles', [
        'user_id' => $candidate->id,
        'candidate_status' => 'new',
    ]);
});

it('deletes custom statuses that are in use and reassigns candidates to new', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();
    $status = CandidateWorkflowStatus::query()->create([
        'key' => 'offer_pending',
        'label' => 'Offer Pending',
        'color' => 'blue',
        'is_default' => false,
        'created_by_user_id' => $admin->id,
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
        'candidate_status' => $status->key,
    ]);

    actingAs($admin)
        ->from(route('recruiter.candidates.index'))
        ->delete(route('recruiter.statuses.destroy', $status))
        ->assertRedirect(route('recruiter.candidates.index'))
        ->assertSessionHas('status', 'candidate-status-deleted')
        ->assertSessionHas('message', 'Custom status deleted. Reassigned 1 candidate(s) to New.');

    $this->assertDatabaseMissing('candidate_workflow_statuses', [
        'id' => $status->id,
    ]);

    $this->assertDatabaseHas('candidate_profiles', [
        'user_id' => $candidate->id,
        'candidate_status' => 'new',
    ]);
});

it('shows paginated candidate listing for admins', function () {
    $admin = User::factory()->admin()->create();

    $candidate = User::factory()->candidate()->create([
        'name' => 'Taylor Recruit',
        'email' => 'taylor@example.test',
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
        'candidate_status' => CandidateStatus::InReview,
    ]);

    $candidate->resumes()->create([
        'file_path' => 'resumes/'.$candidate->id.'/resume.txt',
        'original_name' => 'resume.txt',
        'mime_type' => 'text/plain',
        'file_size' => 200,
        'is_primary' => true,
        'extracted_skills' => ['Laravel', 'PHP'],
        'raw_text' => 'Laravel PHP',
    ]);

    $response = actingAs($admin)->get(route('recruiter.candidates.index', [
        'search' => 'laravel',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('recruiter/candidates/index')
        ->where('candidates.data.0.name', 'Taylor Recruit')
        ->where('candidates.data.0.status', CandidateStatus::InReview->value)
    );
});

it('shows profile skills in recruiter list when resume extracted skills are empty', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create([
        'name' => 'Skill Visible Candidate',
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
        'skills' => ['React', 'TypeScript'],
    ]);

    $candidate->resumes()->create([
        'file_path' => 'resumes/'.$candidate->id.'/resume.txt',
        'original_name' => 'resume.txt',
        'mime_type' => 'text/plain',
        'file_size' => 120,
        'is_primary' => true,
        'extracted_skills' => [],
        'raw_text' => 'Candidate profile data',
    ]);

    actingAs($admin)
        ->get(route('recruiter.candidates.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/candidates/index')
            ->where('candidates.data.0.name', 'Skill Visible Candidate')
            ->where('candidates.data.0.skills.0', 'React')
            ->where('candidates.data.0.skills.1', 'TypeScript')
        );
});

it('allows recruiter workflow actions', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    actingAs($admin)
        ->post(route('recruiter.candidates.star.toggle', $candidate))
        ->assertRedirect();

    $this->assertDatabaseHas('recruiter_candidate_stars', [
        'recruiter_id' => $admin->id,
        'candidate_user_id' => $candidate->id,
    ]);

    actingAs($admin)
        ->patch(route('recruiter.candidates.status.update', $candidate), [
            'status' => CandidateStatus::Shortlisted->value,
            'note' => 'Strong profile',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('candidate_profiles', [
        'user_id' => $candidate->id,
        'candidate_status' => CandidateStatus::Shortlisted->value,
    ]);

    actingAs($admin)
        ->post(route('recruiter.candidates.comments.store', $candidate), [
            'body' => 'Excellent communication and fundamentals.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('recruiter_comments', [
        'recruiter_id' => $admin->id,
        'candidate_user_id' => $candidate->id,
    ]);

    actingAs($admin)
        ->post(route('recruiter.collections.store'), [
            'name' => 'Q2 Shortlist',
            'description' => 'Pipeline for Q2 roles',
        ])
        ->assertRedirect();

    $collection = RecruiterCollection::query()->where('name', 'Q2 Shortlist')->firstOrFail();

    actingAs($admin)
        ->post(route('recruiter.candidates.collections.attach', $candidate), [
            'collection_id' => $collection->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('recruiter_collection_candidate', [
        'recruiter_collection_id' => $collection->id,
        'candidate_user_id' => $candidate->id,
    ]);

    actingAs($admin)
        ->delete(route('recruiter.candidates.collections.remove', [$candidate, $collection]))
        ->assertRedirect();

    $this->assertDatabaseMissing('recruiter_collection_candidate', [
        'recruiter_collection_id' => $collection->id,
        'candidate_user_id' => $candidate->id,
    ]);
});

it('shows progressed education status on candidate detail page', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
        'degree' => 'B.Tech',
        'major' => 'Computer Science',
        'graduation_year' => now()->addYear()->year,
        'is_currently_studying' => true,
        'current_semester' => 6,
        'total_semesters' => 8,
        'semester_recorded_at' => now()->subYear()->toDateString(),
    ]);

    actingAs($admin)
        ->get(route('recruiter.candidates.show', $candidate))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/candidates/show')
            ->where('candidate.education.is_completed', true)
            ->where('candidate.education.projected_semester', 8)
            ->where('candidate.education.status_label', 'Completed')
            ->where('candidate.degree', 'B.Tech')
        );
});

it('shows candidate profile photo url on recruiter detail page', function () {
    Storage::fake(recruiterStorageDisk());

    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();
    $profilePhotoPath = 'resumes/'.$candidate->id.'/profile-photos/photo.jpg';

    Storage::disk(recruiterStorageDisk())->put($profilePhotoPath, 'binary-image-content');

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
        'profile_photo_path' => $profilePhotoPath,
    ]);

    actingAs($admin)
        ->get(route('recruiter.candidates.show', $candidate))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/candidates/show')
            ->where('candidate.profile_photo_url', fn (?string $url): bool => is_string($url) && $url !== '')
        );
});

it('allows updating and deleting recruiter collections', function () {
    $admin = User::factory()->admin()->create();

    $collection = RecruiterCollection::factory()->create([
        'recruiter_id' => $admin->id,
        'name' => 'Initial Name',
    ]);

    actingAs($admin)
        ->put(route('recruiter.collections.update', $collection), [
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('recruiter_collections', [
        'id' => $collection->id,
        'name' => 'Updated Name',
        'description' => 'Updated description',
    ]);

    actingAs($admin)
        ->delete(route('recruiter.collections.destroy', $collection))
        ->assertRedirect(route('recruiter.collections.index'));

    $this->assertDatabaseMissing('recruiter_collections', [
        'id' => $collection->id,
    ]);
});

it('allows recruiter to edit and delete previous candidate comments', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    $comment = $admin->recruiterComments()->create([
        'candidate_user_id' => $candidate->id,
        'body' => 'Original comment',
    ]);

    actingAs($admin)
        ->put(route('recruiter.candidates.comments.update', [$candidate, $comment]), [
            'body' => 'Edited comment',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('recruiter_comments', [
        'id' => $comment->id,
        'body' => 'Edited comment',
    ]);

    actingAs($admin)
        ->delete(route('recruiter.candidates.comments.destroy', [$candidate, $comment]))
        ->assertRedirect();

    $this->assertDatabaseMissing('recruiter_comments', [
        'id' => $comment->id,
    ]);
});

it('shows child collection with inherited parent candidates and supports search', function () {
    $admin = User::factory()->admin()->create();

    $parent = RecruiterCollection::factory()->create([
        'recruiter_id' => $admin->id,
        'name' => 'Backend Roles',
    ]);

    $child = RecruiterCollection::factory()->create([
        'recruiter_id' => $admin->id,
        'parent_id' => $parent->id,
        'name' => 'Laravel Team',
    ]);

    $candidate = User::factory()->candidate()->create([
        'name' => 'Nested Candidate',
        'email' => 'nested@example.test',
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    $parent->candidates()->attach($candidate->id, [
        'added_by_recruiter_id' => $admin->id,
    ]);

    actingAs($admin)
        ->get(route('recruiter.collections.show', [
            'collection' => $child,
            'search' => 'Nested',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/collections/show')
            ->where('collection.name', 'Laravel Team')
            ->where('collection.parent_name', 'Backend Roles')
            ->where('candidates.data.0.name', 'Nested Candidate')
        );
});

it('hides sub-collections from top-level collection listings', function () {
    $admin = User::factory()->admin()->create();

    $parent = RecruiterCollection::factory()->create([
        'recruiter_id' => $admin->id,
        'name' => 'Parent Collection',
        'parent_id' => null,
    ]);

    RecruiterCollection::factory()->create([
        'recruiter_id' => $admin->id,
        'name' => 'Nested Child Collection',
        'parent_id' => $parent->id,
    ]);

    actingAs($admin)
        ->get(route('recruiter.collections.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/collections/index')
            ->has('collections.data', 1)
            ->where('collections.data.0.name', 'Parent Collection')
        );

    actingAs($admin)
        ->get(route('recruiter.candidates.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/candidates/index')
            ->has('collections.data', 1)
            ->where('collections.data.0.name', 'Parent Collection')
        );
});

it('filters only passed out candidates', function () {
    $admin = User::factory()->admin()->create();

    $activeCandidate = User::factory()->candidate()->create([
        'name' => 'Active Student',
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $activeCandidate->id,
        'profile_completed_at' => now(),
        'graduation_year' => now()->addYear()->year,
        'is_currently_studying' => true,
        'current_semester' => 3,
        'total_semesters' => 8,
        'semester_recorded_at' => now()->toDateString(),
    ]);

    $passedOutCandidate = User::factory()->candidate()->create([
        'name' => 'Passed Out Student',
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $passedOutCandidate->id,
        'profile_completed_at' => now(),
        'graduation_year' => now()->subYear()->year,
        'is_currently_studying' => false,
    ]);

    actingAs($admin)
        ->get(route('recruiter.candidates.index', [
            'passed_out' => 1,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/candidates/index')
            ->where('filters.passed_out', true)
            ->has('candidates.data', 1)
            ->where('candidates.data.0.name', 'Passed Out Student')
        );
});

it('allows recruiters to delete candidates', function () {
    Storage::fake('local');

    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    Storage::disk('local')->put("resumes/{$candidate->id}/resume.txt", 'resume content');

    $candidate->resumes()->create([
        'file_path' => "resumes/{$candidate->id}/resume.txt",
        'original_name' => 'resume.txt',
        'mime_type' => 'text/plain',
        'file_size' => 14,
        'is_primary' => true,
        'extracted_skills' => ['Laravel'],
        'raw_text' => 'resume content',
    ]);

    actingAs($admin)
        ->delete(route('recruiter.candidates.destroy', $candidate))
        ->assertRedirect(route('recruiter.candidates.index'));

    $this->assertDatabaseMissing('users', [
        'id' => $candidate->id,
    ]);

    Storage::disk('local')->assertMissing("resumes/{$candidate->id}/resume.txt");
});
