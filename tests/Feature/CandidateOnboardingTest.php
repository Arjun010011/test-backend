<?php

use App\Models\CandidateProfile;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

it('redirects candidates without completed profiles to onboarding', function () {
    $user = User::factory()->candidate()->create();

    actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('candidate.onboarding.edit'));
});

it('allows candidates with completed profiles to access the dashboard', function () {
    $user = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'profile_completed_at' => now(),
    ]);

    actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

it('stores onboarding details, resume, and merged skills', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    $file = UploadedFile::fake()->createWithContent('resume.txt', 'Experienced in PHP and Laravel.');

    actingAs($user)
        ->post(route('candidate.onboarding.store'), [
            'phone' => '+1 555 123 4567',
            'university' => 'State University',
            'degree' => 'B.Tech',
            'major' => 'Computer Science',
            'cgpa' => 8.4,
            'graduation_year' => 2026,
            'location' => 'San Francisco, CA',
            'address_line_1' => '123 Market Street',
            'address_line_2' => 'Suite 5',
            'city' => 'San Francisco',
            'state' => 'CA',
            'country' => 'USA',
            'postal_code' => '94105',
            'linkedin_url' => 'https://linkedin.com/in/example',
            'github_url' => 'https://github.com/example',
            'portfolio_url' => 'https://example.com',
            'bio' => 'Backend engineer with full-stack experience.',
            'skills' => 'React, AWS',
            'resume' => $file,
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('status', 'onboarding-complete');

    $profile = CandidateProfile::query()->where('user_id', $user->id)->firstOrFail();
    $resume = Resume::query()->where('user_id', $user->id)->firstOrFail();

    Storage::assertExists($resume->file_path);
    expect($profile->profile_completed_at)->not->toBeNull();
    expect($profile->skills)->toContain('PHP', 'Laravel', 'React', 'AWS');
    expect($profile->skill_categories['Frameworks'] ?? [])->toContain('Laravel', 'React');
});

it('shows friendly validation errors when required fields are missing', function () {
    $user = User::factory()->candidate()->create();

    actingAs($user)
        ->post(route('candidate.onboarding.store'), [])
        ->assertSessionHasErrors([
            'phone' => 'Please enter your phone number.',
            'resume' => 'Please upload your resume to complete your profile.',
        ]);
});

it('accepts onboarding without optional links', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    $file = UploadedFile::fake()->createWithContent('resume.txt', 'Experienced in PHP and Laravel.');

    actingAs($user)
        ->post(route('candidate.onboarding.store'), [
            'phone' => '+1 555 123 4567',
            'university' => 'State University',
            'degree' => 'B.Tech',
            'major' => 'Computer Science',
            'cgpa' => 8.4,
            'graduation_year' => 2026,
            'location' => 'San Francisco, CA',
            'address_line_1' => '123 Market Street',
            'city' => 'San Francisco',
            'state' => 'CA',
            'country' => 'USA',
            'postal_code' => '94105',
            'bio' => 'Backend engineer with full-stack experience.',
            'skills' => 'React, AWS',
            'resume' => $file,
        ])
        ->assertRedirect(route('dashboard'));

    $profile = CandidateProfile::query()->where('user_id', $user->id)->firstOrFail();

    expect($profile->linkedin_url)->toBeNull();
    expect($profile->github_url)->toBeNull();
    expect($profile->portfolio_url)->toBeNull();
});

it('updates profile details without requiring a new resume upload', function () {
    $user = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'skills' => ['Laravel'],
        'profile_completed_at' => now()->subDay(),
    ]);

    Resume::factory()->create([
        'user_id' => $user->id,
        'is_primary' => true,
        'extracted_skills' => ['Laravel'],
    ]);

    actingAs($user)
        ->post(route('candidate.onboarding.store'), [
            'phone' => '+1 555 987 6543',
            'university' => 'Updated University',
            'degree' => 'B.Tech',
            'major' => 'Computer Science',
            'cgpa' => 9.1,
            'graduation_year' => 2026,
            'location' => 'Bangalore',
            'address_line_1' => '42 Residency Road',
            'city' => 'Bangalore',
            'state' => 'Karnataka',
            'country' => 'India',
            'postal_code' => '560001',
            'skills' => 'TypeScript',
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('status', 'profile-updated');

    $profile = CandidateProfile::query()->where('user_id', $user->id)->firstOrFail();

    expect($profile->university)->toBe('Updated University');
    expect($profile->skills)->toContain('TypeScript', 'Laravel');
    expect(Resume::query()->where('user_id', $user->id)->count())->toBe(1);
});

it('stores current semester details for candidates who are still studying', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    $file = UploadedFile::fake()->createWithContent('resume.txt', 'Experienced in PHP and Laravel.');

    actingAs($user)
        ->post(route('candidate.onboarding.store'), [
            'phone' => '+1 555 222 3333',
            'university' => 'Tech Institute',
            'degree' => 'B.Tech',
            'major' => 'Computer Science',
            'cgpa' => 8.2,
            'graduation_year' => 2027,
            'is_currently_studying' => '1',
            'current_semester' => 6,
            'total_semesters' => 8,
            'location' => 'Austin, TX',
            'address_line_1' => '100 Main Street',
            'city' => 'Austin',
            'state' => 'TX',
            'country' => 'USA',
            'postal_code' => '73301',
            'skills' => 'Laravel',
            'resume' => $file,
        ])
        ->assertRedirect(route('dashboard'));

    $profile = CandidateProfile::query()->where('user_id', $user->id)->firstOrFail();

    expect($profile->is_currently_studying)->toBeTrue();
    expect($profile->current_semester)->toBe(6);
    expect($profile->total_semesters)->toBe(8);
    expect($profile->semester_recorded_at)->not->toBeNull();
});

it('stores only predefined manual skills and ignores invalid skill tags', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    $file = UploadedFile::fake()->createWithContent('resume.txt', 'Experienced in Laravel and PHP.');

    actingAs($user)
        ->post(route('candidate.onboarding.store'), [
            'phone' => '+1 555 222 8888',
            'university' => 'Tech Institute',
            'degree' => 'B.Tech',
            'major' => 'Computer Science',
            'graduation_year' => 2027,
            'location' => 'Austin, TX',
            'address_line_1' => '100 Main Street',
            'city' => 'Austin',
            'state' => 'TX',
            'country' => 'USA',
            'postal_code' => '73301',
            'skills' => ['Java', 'WrongTagSkill'],
            'resume' => $file,
        ])
        ->assertRedirect(route('dashboard'));

    $profile = CandidateProfile::query()->where('user_id', $user->id)->firstOrFail();

    expect($profile->skills)->toContain('Java');
    expect($profile->skills)->not->toContain('WrongTagSkill');
});
