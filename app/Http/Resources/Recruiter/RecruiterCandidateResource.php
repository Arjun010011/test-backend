<?php

namespace App\Http\Resources\Recruiter;

use App\Support\CandidateStatusCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruiterCandidateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->candidateProfile;
        $primaryResume = $this->resumes->first();
        $status = app(CandidateStatusCatalog::class)->optionFor($profile?->candidate_status ?? 'new');
        $profileSkills = is_array($profile?->skills) ? $profile->skills : [];
        $resumeSkills = is_array($primaryResume?->extracted_skills) ? $primaryResume->extracted_skills : [];
        $skills = collect([...$profileSkills, ...$resumeSkills])
            ->map(fn (mixed $skill): string => trim((string) $skill))
            ->filter(fn (string $skill): bool => $skill !== '')
            ->unique(fn (string $skill): string => mb_strtolower($skill))
            ->values()
            ->all();
        $education = $profile?->educationStatus();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'location' => $profile?->location,
            'graduation_year' => $profile?->graduation_year,
            'university' => $profile?->university,
            'degree' => $profile?->degree,
            'major' => $profile?->major,
            'achievements' => $profile?->achievements,
            'hackathons_experience' => $profile?->hackathons_experience,
            'projects_description' => $profile?->projects_description,
            'education' => $education,
            'skills' => $skills,
            'status' => $status['value'],
            'status_label' => $status['label'],
            'status_color' => $status['color'],
            'is_starred' => (bool) ($this->is_starred ?? false),
            'stars_count' => (int) ($this->stars_count ?? 0),
            'comments_count' => (int) ($this->comments_count ?? 0),
            'latest_resume' => $primaryResume === null ? null : [
                'id' => $primaryResume->id,
                'original_name' => $primaryResume->original_name,
                'file_size' => $primaryResume->file_size,
                'created_at' => $primaryResume->created_at?->toDateTimeString(),
                'download_url' => route('recruiter.candidates.resume.download', $this->id),
            ],
            'collections' => $this->whenLoaded('recruiterCollections', fn (): array => $this->recruiterCollections
                ->map(fn ($collection): array => [
                    'id' => $collection->id,
                    'name' => $collection->name,
                ])
                ->values()
                ->all(), []),
        ];
    }
}
