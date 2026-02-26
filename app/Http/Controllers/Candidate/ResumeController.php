<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ScanResume;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\StoreResumeRequest;
use App\Models\CandidateProfile;
use App\Models\Resume;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

class ResumeController extends Controller
{
    /**
     * Show the resume upload page for candidates.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user?->isCandidate(), 403);

        return Inertia::render('candidate/resume', [
            'latestResume' => $user->resumes()->latest()->first(),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Store a candidate resume and scan it for skills.
     */
    public function store(StoreResumeRequest $request, ScanResume $scanResume): RedirectResponse
    {
        $user = $request->user();
        $file = $request->file('resume');

        if ($user === null || $file === null) {
            abort(403);
        }

        $scan = $scanResume($file);

        DB::transaction(function () use ($user, $file, $scan): void {
            $path = $file->store('resumes/' . $user->id);

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

            $this->syncCandidateSkills($user->id, $scan['extracted_skills']);
        });

        return to_route('candidate.resume.edit')->with('status', 'resume-uploaded');
    }

    /**
     * View a candidate resume.
     */
    public function show(Request $request, Resume $resume): BinaryFileResponse
    {
        $user = $request->user();

        abort_unless($user !== null && $user->id === $resume->user_id, 403);

        $path = Storage::disk('local')->path($resume->file_path);

        abort_unless(is_file($path), 404);

        return response()
            ->file($path, [
                'Content-Type' => $resume->mime_type,
            ])
            ->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $resume->original_name);
    }

    /**
     * @param  list<string>  $skills
     */
    protected function syncCandidateSkills(int $userId, array $skills): void
    {
        if ($skills === []) {
            return;
        }

        $profile = CandidateProfile::firstOrCreate(['user_id' => $userId]);
        $currentSkills = $profile->skills ?? [];

        $profile->forceFill([
            'skills' => array_values(array_unique(array_merge($currentSkills, $skills))),
        ])->save();
    }
}
