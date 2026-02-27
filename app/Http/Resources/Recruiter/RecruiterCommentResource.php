<?php

namespace App\Http\Resources\Recruiter;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruiterCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'candidate_user_id' => $this->candidate_user_id,
            'recruiter' => [
                'id' => $this->recruiter?->id,
                'name' => $this->recruiter?->name,
                'email' => $this->recruiter?->email,
            ],
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'update_url' => route('recruiter.candidates.comments.update', [$this->candidate_user_id, $this->id]),
            'delete_url' => route('recruiter.candidates.comments.destroy', [$this->candidate_user_id, $this->id]),
            'can_update' => (bool) $request->user()?->can('update', $this->resource),
            'can_delete' => (bool) $request->user()?->can('delete', $this->resource),
        ];
    }
}
