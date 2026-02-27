<?php

namespace App\Http\Resources\Recruiter;

use App\Enums\CandidateStatus;
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
        $status = $profile?->candidate_status ?? CandidateStatus::New;
        $skills = $primaryResume?->extracted_skills ?? $profile?->skills ?? [];
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
            'education' => $education,
            'skills' => is_array($skills) ? $skills : [],
            'status' => $status->value,
            'status_label' => $status->label(),
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
