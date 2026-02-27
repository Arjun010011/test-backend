<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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

        $user?->load([
            'candidateProfile',
            'resumes' => fn ($query) => $query->latest()->limit(1),
        ]);

        $resume = $user?->resumes->first();
        $profile = $user?->candidateProfile;

        return Inertia::render('dashboard', [
            'candidateResume' => $resume === null ? null : [
                'id' => $resume->id,
                'original_name' => $resume->original_name,
                'file_size' => $resume->file_size,
                'extracted_skills' => $resume->extracted_skills ?? [],
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
            ],
            'status' => $request->session()->get('status'),
        ]);
    }
}
