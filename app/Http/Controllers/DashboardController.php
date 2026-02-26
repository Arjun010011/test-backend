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
    public function show(Request $request): Response
    {
        $user = $request->user();

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
                'location' => $profile->location,
                'skills' => $profile->skills ?? [],
            ],
        ]);
    }
}
