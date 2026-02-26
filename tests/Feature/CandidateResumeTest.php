<?php

use App\Models\CandidateProfile;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

it('allows a candidate to upload a resume and extracts skills', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    $file = UploadedFile::fake()->createWithContent('resume.txt', 'Experienced in PHP and Laravel.');

    actingAs($user)
        ->post(route('candidate.resume.store'), [
            'resume' => $file,
        ])
        ->assertRedirect(route('candidate.resume.edit'));

    $resume = Resume::query()->where('user_id', $user->id)->firstOrFail();

    Storage::assertExists($resume->file_path);
    expect($resume->original_name)->toBe('resume.txt');
    expect($resume->extracted_skills)->toContain('PHP', 'Laravel');
});

it('prevents non-candidates from uploading resumes', function () {
    $user = User::factory()->admin()->create();
    $file = UploadedFile::fake()->createWithContent('resume.txt', 'PHP and Laravel.');

    actingAs($user)
        ->post(route('candidate.resume.store'), [
            'resume' => $file,
        ])
        ->assertForbidden();
});

it('filters candidates by extracted skills', function () {
    $matchingUser = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $matchingUser->id,
        'skills' => ['PHP', 'Laravel'],
    ]);

    $nonMatchingUser = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $nonMatchingUser->id,
        'skills' => ['React'],
    ]);

    $admin = User::factory()->admin()->create();

    $matchedIds = User::query()->candidatesWithSkills(['Laravel'])->pluck('id');

    expect($matchedIds)->toContain($matchingUser->id)
        ->not()->toContain($nonMatchingUser->id)
        ->not()->toContain($admin->id);
});

it('allows a candidate to view their resume file', function () {
    Storage::fake('local');

    $user = User::factory()->candidate()->create();
    $path = 'resumes/' . $user->id . '/resume.txt';
    Storage::disk('local')->put($path, 'Resume content');

    $resume = Resume::factory()->create([
        'user_id' => $user->id,
        'file_path' => $path,
        'original_name' => 'resume.txt',
        'mime_type' => 'text/plain',
    ]);

    actingAs($user)
        ->get(route('candidate.resume.show', $resume))
        ->assertOk()
        ->assertHeaderContains('content-type', 'text/plain');
});

it('prevents candidates from viewing other resumes', function () {
    Storage::fake('local');

    $owner = User::factory()->candidate()->create();
    $path = 'resumes/' . $owner->id . '/resume.txt';
    Storage::disk('local')->put($path, 'Resume content');

    $resume = Resume::factory()->create([
        'user_id' => $owner->id,
        'file_path' => $path,
        'original_name' => 'resume.txt',
        'mime_type' => 'text/plain',
    ]);

    $otherUser = User::factory()->candidate()->create();

    actingAs($otherUser)
        ->get(route('candidate.resume.show', $resume))
        ->assertForbidden();
});
