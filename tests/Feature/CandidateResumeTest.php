<?php

use App\Models\CandidateProfile;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

function makeDocxContents(string $text): string
{
    $tmpPath = tempnam(sys_get_temp_dir(), 'resume-docx-');

    if ($tmpPath === false) {
        return '';
    }

    $zip = new \ZipArchive;

    if ($zip->open($tmpPath, \ZipArchive::CREATE) !== true) {
        unlink($tmpPath);

        return '';
    }

    $safeText = htmlspecialchars($text, ENT_XML1);
    $document = <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>{$safeText}</w:t></w:r></w:p>
  </w:body>
</w:document>
XML;

    $zip->addFromString('word/document.xml', $document);
    $zip->close();

    $contents = file_get_contents($tmpPath);

    unlink($tmpPath);

    return $contents === false ? '' : $contents;
}

it('allows a candidate to upload a resume and extracts skills', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'profile_completed_at' => now(),
    ]);
    $file = UploadedFile::fake()->createWithContent('resume.txt', 'Experienced in PHP and Laravel.');

    actingAs($user)
        ->post(route('candidate.resume.store'), [
            'resume' => $file,
        ])
        ->assertRedirect(route('candidate.resume.edit'));

    $resume = Resume::query()->where('user_id', $user->id)->firstOrFail();
    $profile = CandidateProfile::query()->where('user_id', $user->id)->firstOrFail();

    Storage::assertExists($resume->file_path);
    expect($resume->original_name)->toBe('resume.txt');
    expect($resume->extracted_skills)->toContain('PHP', 'Laravel');
    expect($profile->skill_categories['Languages'] ?? [])->toContain('PHP');
    expect($profile->skill_categories['Frameworks'] ?? [])->toContain('Laravel');
});

it('extracts skills from docx resumes', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'profile_completed_at' => now(),
    ]);
    $contents = makeDocxContents('Skilled in PHP and React.');
    $file = UploadedFile::fake()->createWithContent(
        'resume.docx',
        $contents,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    actingAs($user)
        ->post(route('candidate.resume.store'), [
            'resume' => $file,
        ])
        ->assertRedirect(route('candidate.resume.edit'));

    $resume = Resume::query()->where('user_id', $user->id)->firstOrFail();

    expect($resume->extracted_skills)->toContain('PHP', 'React');
});

it('replaces candidate profile skills when uploading a new resume', function () {
    Storage::fake();

    $user = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'profile_completed_at' => now(),
    ]);

    actingAs($user)
        ->post(route('candidate.resume.store'), [
            'resume' => UploadedFile::fake()->createWithContent('resume.txt', 'PHP and Laravel'),
        ])
        ->assertRedirect(route('candidate.resume.edit'));

    actingAs($user)
        ->post(route('candidate.resume.store'), [
            'resume' => UploadedFile::fake()->createWithContent('resume.txt', 'React and TypeScript'),
        ])
        ->assertRedirect(route('candidate.resume.edit'));

    $profile = CandidateProfile::query()->where('user_id', $user->id)->firstOrFail();

    expect($profile->skills)
        ->toContain('React', 'TypeScript')
        ->not()->toContain('PHP', 'Laravel');
    expect($profile->skill_categories['Frameworks'] ?? [])->toContain('React');
    expect($profile->skill_categories['Languages'] ?? [])->toContain('TypeScript');
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
    CandidateProfile::factory()->create([
        'user_id' => $user->id,
        'profile_completed_at' => now(),
    ]);
    $path = 'resumes/'.$user->id.'/resume.txt';
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
    CandidateProfile::factory()->create([
        'user_id' => $owner->id,
        'profile_completed_at' => now(),
    ]);
    $path = 'resumes/'.$owner->id.'/resume.txt';
    Storage::disk('local')->put($path, 'Resume content');

    $resume = Resume::factory()->create([
        'user_id' => $owner->id,
        'file_path' => $path,
        'original_name' => 'resume.txt',
        'mime_type' => 'text/plain',
    ]);

    $otherUser = User::factory()->candidate()->create();
    CandidateProfile::factory()->create([
        'user_id' => $otherUser->id,
        'profile_completed_at' => now(),
    ]);

    actingAs($otherUser)
        ->get(route('candidate.resume.show', $resume))
        ->assertForbidden();
});
