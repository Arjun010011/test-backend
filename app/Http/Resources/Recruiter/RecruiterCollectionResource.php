<?php

namespace App\Http\Resources\Recruiter;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruiterCollectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'recruiter_id' => $this->recruiter_id,
            'parent_id' => $this->parent_id,
            'parent_name' => $this->parent?->name,
            'candidates_count' => (int) ($this->candidates_count ?? 0),
            'created_at' => $this->created_at?->toDateTimeString(),
            'update_url' => route('recruiter.collections.update', $this->id),
            'delete_url' => route('recruiter.collections.destroy', $this->id),
        ];
    }
}
