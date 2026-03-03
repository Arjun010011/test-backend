<?php

namespace App\Http\Controllers;

use App\Models\Resume;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the application dashboard.
     */
    public function show(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        if (in_array($user?->role, [\App\Enums\Role::Admin, \App\Enums\Role::SuperAdmin])) {
            return redirect()->route('recruiter.dashboard');
        }

        if ($user?->role === \App\Enums\Role::Company) {
            return redirect()->route('company.dashboard');
        }

        $user?->load('candidateProfile');

        $resume = $user?->resumes()
            ->where('is_primary', true)
            ->latest('id')
            ->first()
            ?? $user?->resumes()->latest('id')->first();
        $profile = $user?->candidateProfile;

        return Inertia::render('dashboard', [
            'candidateResume' => $resume === null ? null : [
                'id' => $resume->id,
                'original_name' => $resume->original_name,
                'file_size' => $resume->file_size,
                'extracted_skills' => $resume->extracted_skills ?? [],
                'view_url' => $this->resolveResumeViewUrl($resume),
                'raw_text_preview' => $resume->raw_text === null
                    ? null
                    : Str::limit($resume->raw_text, 500),
                'created_at' => $resume->created_at?->toDateTimeString(),
            ],
            'candidateProfile' => $profile === null ? null : [
                'phone' => $profile->phone,
                'university' => $profile->university,
                'degree' => $profile->degree,
                'major' => $profile->major,
                'graduation_year' => $profile->graduation_year,
                'is_currently_studying' => (bool) $profile->is_currently_studying,
                'current_semester' => $profile->current_semester,
                'total_semesters' => $profile->total_semesters,
                'education' => $profile->educationStatus(),
                'location' => $profile->location,
                'skills' => $profile->skills ?? [],
                'skill_categories' => $profile->skill_categories ?? [],
                'achievements' => $profile->achievements,
                'hackathons_experience' => $profile->hackathons_experience,
                'projects_description' => $profile->projects_description,
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    protected function resolveResumeViewUrl(Resume $resume): string
    {
        $disk = config('resume.storage_disk', config('filesystems.default', 'local'));
        $storage = Storage::disk($disk);

        if (! $storage->exists($resume->file_path) && $disk !== 'local') {
            return route('candidate.resume.show', $resume);
        }

        $driver = config("filesystems.disks.{$disk}.driver");

        if ($driver === 's3') {
            return $storage->temporaryUrl(
                $resume->file_path,
                now()->addMinutes(5),
                [
                    'ResponseContentType' => $resume->mime_type,
                    'ResponseContentDisposition' => sprintf('inline; filename="%s"', $resume->original_name),
                ],
            );
        }

        return route('candidate.resume.show', $resume);
    }
}
