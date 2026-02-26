<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\NormalizeSkills;
use App\Actions\Candidate\ScanResume;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\OnboardingRequest;
use App\Models\CandidateProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        return Inertia::render('candidate/onboarding', [
            'profile' => $profile === null ? null : [
                'phone' => $profile->phone,
                'university' => $profile->university,
                'degree' => $profile->degree,
                'major' => $profile->major,
                'cgpa' => $profile->cgpa,
                'graduation_year' => $profile->graduation_year,
                'location' => $profile->location,
                'address_line_1' => $profile->address_line_1,
                'address_line_2' => $profile->address_line_2,
                'city' => $profile->city,
                'state' => $profile->state,
                'country' => $profile->country,
                'postal_code' => $profile->postal_code,
                'linkedin_url' => $profile->linkedin_url,
                'github_url' => $profile->github_url,
                'portfolio_url' => $profile->portfolio_url,
                'bio' => $profile->bio,
                'skills' => $profile->skills ?? [],
            ],
            'hasResume' => $user->resumes()->exists(),
            'isCompleted' => $profile?->profile_completed_at !== null,
            'skillCatalog' => config('resume.skill_catalog', []),
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
        $manualSkills = $normalizeSkills->fromString($request->input('skills'));
        $resumeSkills = $scan['extracted_skills'] ?? ($existingProfile?->skills ?? []);
        $mergedSkills = $normalizeSkills->merge($manualSkills, $resumeSkills);
        $skillCategories = $scanResume->categorize($mergedSkills);

        DB::transaction(function () use ($request, $user, $file, $scan, $mergedSkills, $skillCategories): void {
            if ($file !== null && $scan !== null) {
                $path = $file->store('resumes/'.$user->id);

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
                    'location' => $request->string('location')->toString(),
                    'address_line_1' => $request->string('address_line_1')->toString(),
                    'address_line_2' => $request->filled('address_line_2')
                        ? $request->string('address_line_2')->toString()
                        : null,
                    'city' => $request->string('city')->toString(),
                    'state' => $request->string('state')->toString(),
                    'country' => $request->string('country')->toString(),
                    'postal_code' => $request->string('postal_code')->toString(),
                    'linkedin_url' => $request->string('linkedin_url')->toString() ?: null,
                    'github_url' => $request->string('github_url')->toString() ?: null,
                    'portfolio_url' => $request->string('portfolio_url')->toString() ?: null,
                    'bio' => $request->string('bio')->toString() ?: null,
                    'skills' => $mergedSkills,
                    'skill_categories' => $skillCategories,
                    'profile_completed_at' => now(),
                ],
            );
        });

        return to_route('dashboard')->with(
            'status',
            $wasProfileCompleted ? 'profile-updated' : 'onboarding-complete',
        );
    }
}
