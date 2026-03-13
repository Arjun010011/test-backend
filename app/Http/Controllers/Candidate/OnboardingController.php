<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\NormalizeSkills;
use App\Actions\Candidate\ScanResume;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\OnboardingRequest;
use App\Http\Requests\Candidate\ProfilePhotoUpdateRequest;
use App\Models\CandidateProfile;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Show the candidate onboarding form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user?->isCandidate(), 403);

        $profile = $user->candidateProfile;
        $dbSkillCatalog = Skill::query()
            ->active()
            ->orderBy('name')
            ->pluck('name')
            ->all();

        return Inertia::render('candidate/onboarding', [
            'profile' => $profile === null ? null : [
                'phone' => $profile->phone,
                'university' => $profile->university,
                'degree' => $profile->degree,
                'major' => $profile->major,
                'cgpa' => $profile->cgpa,
                'graduation_year' => $profile->graduation_year,
                'is_currently_studying' => (bool) $profile->is_currently_studying,
                'current_semester' => $profile->current_semester,
                'total_semesters' => $profile->total_semesters,
                'location' => $profile->location,
                'address_line_1' => $profile->address_line_1,
                'address_line_2' => $profile->address_line_2,
                'city' => $profile->city,
                'state' => $profile->state,
                'district' => $profile->district,
                'country' => $profile->country,
                'postal_code' => $profile->postal_code,
                'linkedin_url' => $profile->linkedin_url,
                'github_url' => $profile->github_url,
                'portfolio_url' => $profile->portfolio_url,
                'profile_photo_url' => $profile->profilePhotoUrl(),
                'bio' => $profile->bio,
                'achievements' => $profile->achievements,
                'hackathons_experience' => $profile->hackathons_experience,
                'projects_description' => $profile->projects_description,
                'skills' => $profile->skills ?? [],
                'gender' => $profile->gender,
                'date_of_birth' => $profile->date_of_birth?->toDateString(),
                'experience_years' => $profile->experience_years,
                'current_company' => $profile->current_company,
                'previous_company' => $profile->previous_company,
                'industries' => $profile->industries ?? [],
                'annual_salary_lpa' => $profile->annual_salary_lpa,
                'languages' => $profile->languages ?? [],
                'english_fluency' => $profile->english_fluency,
            ],
            'hasResume' => $user->resumes()->exists(),
            'isCompleted' => $profile?->profile_completed_at !== null,
            'skillCatalog' => $dbSkillCatalog !== [] ? $dbSkillCatalog : config('resume.skill_catalog', []),
            'defaultCountry' => config('location.country', 'India'),
            'locationHierarchy' => config('location.states', []),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Store the candidate onboarding details and resume.
     */
    public function store(
        OnboardingRequest $request,
        ScanResume $scanResume,
        NormalizeSkills $normalizeSkills,
    ): RedirectResponse {
        $user = $request->user();
        $file = $request->file('resume');

        if ($user === null) {
            abort(403);
        }

        $existingProfile = $user->candidateProfile;
        $wasProfileCompleted = $existingProfile?->profile_completed_at !== null;
        $scan = $file === null ? null : $scanResume($file);
        $manualSkillInputs = $request->input('skills');
        $manualSkills = is_string($manualSkillInputs)
            ? $normalizeSkills->fromString($manualSkillInputs)
            : $normalizeSkills->normalize(is_array($manualSkillInputs) ? $manualSkillInputs : []);
        $allowedSkills = Skill::query()
            ->active()
            ->pluck('name')
            ->all();
        $allowedCatalog = $allowedSkills !== [] ? $allowedSkills : config('resume.skill_catalog', []);
        $allowedMap = [];

        foreach ($allowedCatalog as $allowedSkill) {
            $allowedMap[strtolower($allowedSkill)] = $allowedSkill;
        }

        $manualSkills = collect($manualSkills)
            ->map(fn (string $skill): ?string => $allowedMap[strtolower($skill)] ?? null)
            ->filter()
            ->values()
            ->all();
        $resumeSkills = $scan['extracted_skills'] ?? ($existingProfile?->skills ?? []);
        $mergedSkills = $normalizeSkills->merge($manualSkills, $resumeSkills);
        $skillCategories = $scanResume->categorize($mergedSkills);
        $isCurrentlyStudying = $request->boolean('is_currently_studying');
        $currentSemester = $isCurrentlyStudying
            ? (int) $request->input('current_semester')
            : null;
        $totalSemesters = $isCurrentlyStudying
            ? (int) $request->input('total_semesters')
            : null;
        $semesterRecordedAt = null;

        if ($isCurrentlyStudying) {
            $semesterChanged = $existingProfile === null
                || ! $existingProfile->is_currently_studying
                || (int) $existingProfile->current_semester !== $currentSemester
                || (int) $existingProfile->total_semesters !== $totalSemesters;

            $semesterRecordedAt = $semesterChanged
                ? now()->toDateString()
                : $existingProfile->semester_recorded_at?->toDateString();
        }

        DB::transaction(function () use (
            $request,
            $user,
            $file,
            $scan,
            $mergedSkills,
            $skillCategories,
            $isCurrentlyStudying,
            $currentSemester,
            $totalSemesters,
            $semesterRecordedAt,
        ): void {
            if ($file !== null && $scan !== null) {
                $disk = config('resume.storage_disk', config('filesystems.default', 'local'));
                $directory = trim((string) config('resume.storage_directory', 'resumes'), '/');
                $path = $file->store($directory.'/'.$user->id, $disk);

                $resume = $user->resumes()->create([
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType() ?? $file->getMimeType() ?? 'application/octet-stream',
                    'file_size' => max(0, (int) $file->getSize()),
                    'is_primary' => true,
                    'extracted_skills' => $scan['extracted_skills'],
                    'raw_text' => $scan['raw_text'],
                ]);

                $user->resumes()->whereKeyNot($resume->id)->update(['is_primary' => false]);
            }

            CandidateProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone' => $request->string('phone')->toString(),
                    'university' => $request->string('university')->toString(),
                    'degree' => $request->string('degree')->toString(),
                    'major' => $request->string('major')->toString(),
                    'cgpa' => $request->input('cgpa'),
                    'graduation_year' => (int) $request->input('graduation_year'),
                    'is_currently_studying' => $isCurrentlyStudying,
                    'current_semester' => $currentSemester,
                    'total_semesters' => $totalSemesters,
                    'semester_recorded_at' => $semesterRecordedAt,
                    'location' => $request->string('location')->toString(),
                    'address_line_1' => $request->string('address_line_1')->toString(),
                    'address_line_2' => $request->filled('address_line_2')
                        ? $request->string('address_line_2')->toString()
                        : null,
                    'city' => $request->string('city')->toString(),
                    'state' => $request->string('state')->toString(),
                    'district' => $request->string('district')->toString(),
                    'country' => $request->string('country')->toString(),
                    'postal_code' => $request->string('postal_code')->toString(),
                    'linkedin_url' => $request->string('linkedin_url')->toString() ?: null,
                    'github_url' => $request->string('github_url')->toString() ?: null,
                    'portfolio_url' => $request->string('portfolio_url')->toString() ?: null,
                    'bio' => $request->string('bio')->toString() ?: null,
                    'achievements' => $request->string('achievements')->toString() ?: null,
                    'hackathons_experience' => $request->string('hackathons_experience')->toString() ?: null,
                    'projects_description' => $request->string('projects_description')->toString() ?: null,
                    'skills' => $mergedSkills,
                    'skill_categories' => $skillCategories,
                    'gender' => $request->string('gender')->toString() ?: null,
                    'date_of_birth' => $request->input('date_of_birth'),
                    'experience_years' => $request->input('experience_years'),
                    'current_company' => $request->string('current_company')->toString() ?: null,
                    'previous_company' => $request->string('previous_company')->toString() ?: null,
                    'industries' => $request->input('industries', []),
                    'annual_salary_lpa' => $request->input('annual_salary_lpa'),
                    'languages' => $request->input('languages', []),
                    'english_fluency' => $request->string('english_fluency')->toString() ?: null,
                    'profile_completed_at' => now(),
                ],
            );
        });

        return to_route('dashboard')->with(
            'status',
            $wasProfileCompleted ? 'profile-updated' : 'onboarding-complete',
        );
    }

    public function updateProfilePhoto(ProfilePhotoUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        $profile = CandidateProfile::query()->firstOrCreate(['user_id' => $user->id]);
        $disk = config('resume.storage_disk', config('filesystems.default', 'local'));
        $directory = trim((string) config('resume.storage_directory', 'resumes'), '/').'/'.$user->id.'/profile-photos';
        $existingPath = is_string($profile->profile_photo_path) ? $profile->profile_photo_path : null;

        if ($request->boolean('remove_profile_photo')) {
            if ($existingPath !== null && $existingPath !== '') {
                Storage::disk($disk)->delete($existingPath);

                if ($disk !== 'local') {
                    Storage::disk('local')->delete($existingPath);
                }
            }

            $profile->forceFill([
                'profile_photo_path' => null,
            ])->save();

            return back()->with('status', 'profile-photo-removed');
        }

        $file = $request->file('profile_photo');

        if ($file === null) {
            return back();
        }

        $newPath = $file->store($directory, $disk);

        $profile->forceFill([
            'profile_photo_path' => $newPath,
        ])->save();

        if ($existingPath !== null && $existingPath !== '' && $existingPath !== $newPath) {
            Storage::disk($disk)->delete($existingPath);

            if ($disk !== 'local') {
                Storage::disk('local')->delete($existingPath);
            }
        }

        return back()->with('status', 'profile-photo-updated');
    }
}
