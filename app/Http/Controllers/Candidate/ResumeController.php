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
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
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

        $latestResume = $user->resumes()
            ->where('is_primary', true)
            ->latest('id')
            ->first()
            ?? $user->resumes()->latest('id')->first();

        return Inertia::render('candidate/resume', [
            'latestResume' => $latestResume,
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
        $disk = config('resume.storage_disk', config('filesystems.default', 'local'));
        $directory = trim((string) config('resume.storage_directory', 'resumes'), '/');

        if ($user === null || $file === null) {
            abort(403);
        }

        $scan = $scanResume($file);

        DB::transaction(function () use ($user, $file, $scan, $disk, $directory): void {
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

            $this->syncCandidateSkills($user->id, $scan['extracted_skills'], $scan['skill_categories']);
        });

        return to_route('candidate.resume.edit')->with('status', 'resume-uploaded');
    }

    /**
     * View a candidate resume.
     */
    public function show(Request $request, Resume $resume): SymfonyResponse|RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null && $user->id === $resume->user_id, 403);

        $disk = config('resume.storage_disk', config('filesystems.default', 'local'));
        $storage = Storage::disk($disk);

        if (! $storage->exists($resume->file_path) && $disk !== 'local') {
            $localStorage = Storage::disk('local');

            if ($localStorage->exists($resume->file_path)) {
                $disk = 'local';
                $storage = $localStorage;
            }
        }

        $driver = config("filesystems.disks.{$disk}.driver");

        abort_unless($storage->exists($resume->file_path), 404);

        if ($driver === 's3') {
            return redirect()->away(
                $storage->temporaryUrl(
                    $resume->file_path,
                    now()->addMinutes(5),
                    [
                        'ResponseContentType' => $resume->mime_type,
                        'ResponseContentDisposition' => sprintf('inline; filename="%s"', $resume->original_name),
                    ],
                ),
            );
        }

        return $storage->response(
            $resume->file_path,
            $resume->original_name,
            [
                'Content-Type' => $resume->mime_type,
            ],
            ResponseHeaderBag::DISPOSITION_INLINE,
        );
    }

    /**
     * @param  list<string>  $skills
     * @param  array<string, list<string>>  $skillCategories
     */
    protected function syncCandidateSkills(int $userId, array $skills, array $skillCategories): void
    {
        $profile = CandidateProfile::firstOrCreate(['user_id' => $userId]);

        $profile->forceFill([
            'skills' => array_values(array_unique($skills)),
            'skill_categories' => $skillCategories === [] ? [] : $skillCategories,
        ])->save();
    }
}
