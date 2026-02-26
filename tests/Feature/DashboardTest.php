<?php

use App\Models\CandidateProfile;
use App\Models\Resume;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard shows candidate resume and profile details', function () {
    $user = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'skills' => ['Laravel', 'React'],
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
        ->where('candidateResume.extracted_skills', ['Laravel', 'PHP'])
        ->where('candidateProfile.university', 'State University')
        ->where('candidateProfile.skills', ['Laravel', 'React'])
    );
});
