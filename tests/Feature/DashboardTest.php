<?php

use App\Models\CandidateProfile;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('admins are redirected to recruiter dashboard from default dashboard', function () {
    $user = User::factory()->admin()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('recruiter.dashboard'));
});

test('dashboard shows candidate resume and profile details', function () {
    config()->set('resume.storage_disk', 'local');

    $user = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'skills' => ['Laravel', 'React'],
        'skill_categories' => [
            'Frameworks' => ['Laravel', 'React'],
        ],
        'profile_completed_at' => now(),
        'university' => 'State University',
    ]);

    $resume = Resume::factory()->create([
        'user_id' => $user->id,
        'original_name' => 'resume.pdf',
        'file_size' => 250_000,
        'extracted_skills' => ['Laravel', 'PHP'],
        'raw_text' => 'Experienced in Laravel and PHP.',
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('candidateResume.id', $resume->id)
        ->where('candidateResume.original_name', 'resume.pdf')
        ->where('candidateResume.view_url', route('candidate.resume.show', $resume))
        ->where('candidateResume.extracted_skills', ['Laravel', 'PHP'])
        ->where('candidateProfile.university', 'State University')
        ->where('candidateProfile.skills', ['Laravel', 'React'])
        ->where('candidateProfile.skill_categories', [
            'Frameworks' => ['Laravel', 'React'],
        ])
    );
});

test('dashboard prefers primary resume when multiple resumes exist', function () {
    config()->set('resume.storage_disk', 'local');

    $user = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'profile_completed_at' => now(),
    ]);

    Resume::factory()->create([
        'user_id' => $user->id,
        'original_name' => 'older-non-primary.pdf',
        'is_primary' => false,
    ]);

    $primaryResume = Resume::factory()->create([
        'user_id' => $user->id,
        'original_name' => 'primary.pdf',
        'is_primary' => true,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('candidateResume.id', $primaryResume->id)
        ->where('candidateResume.original_name', 'primary.pdf')
        ->where('candidateResume.view_url', route('candidate.resume.show', $primaryResume))
    );
});

test('dashboard exposes temporary s3 resume view url when resume disk is s3', function () {
    config()->set('resume.storage_disk', 's3');
    Storage::fake('s3');
    Storage::disk('s3')->buildTemporaryUrlsUsing(fn (): string => 'https://s3.example.com/resumes/dashboard-resume.pdf?signature=test');

    $user = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'profile_completed_at' => now(),
    ]);

    $resume = Resume::factory()->create([
        'user_id' => $user->id,
        'file_path' => 'resumes/'.$user->id.'/dashboard-resume.pdf',
        'original_name' => 'dashboard-resume.pdf',
        'mime_type' => 'application/pdf',
        'is_primary' => true,
    ]);
    Storage::disk('s3')->put($resume->file_path, 'pdf-content');

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('candidateResume.id', $resume->id)
        ->where('candidateResume.view_url', 'https://s3.example.com/resumes/dashboard-resume.pdf?signature=test')
    );
});
