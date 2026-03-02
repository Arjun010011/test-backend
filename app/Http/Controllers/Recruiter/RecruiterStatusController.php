<?php

namespace App\Http\Controllers\Recruiter;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Recruiter\StoreCandidateWorkflowStatusRequest;
use App\Http\Requests\Recruiter\UpdateCandidateWorkflowStatusRequest;
use App\Models\CandidateProfile;
use App\Models\CandidateWorkflowStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RecruiterStatusController extends Controller
{
    public function store(StoreCandidateWorkflowStatusRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $label = $request->validated('label');
        $key = Str::of($label)
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->value();

        abort_if($key === '', 422, 'Invalid status label.');
        abort_if(CandidateWorkflowStatus::query()->where('key', $key)->exists(), 422, 'Status already exists.');

        CandidateWorkflowStatus::query()->create([
            'key' => $key,
            'label' => $label,
            'color' => $request->validated('color', 'gray'),
            'is_default' => false,
            'created_by_user_id' => $user->id,
        ]);

        return back()->with('status', 'candidate-status-created');
    }

    public function destroy(Request $request, CandidateWorkflowStatus $status): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        if ($status->is_default) {
            return to_route('recruiter.candidates.index')->with('status', 'candidate-status-delete-error-default');
        }

        $candidateUsageCount = CandidateProfile::query()
            ->where('candidate_status', $status->key)
            ->whereHas('user', fn ($query) => $query->where('role', Role::Candidate->value))
            ->count();

        DB::transaction(function () use ($status): void {
            CandidateProfile::query()
                ->where('candidate_status', $status->key)
                ->whereHas('user', fn ($query) => $query->where('role', Role::Candidate->value))
                ->update(['candidate_status' => 'new']);

            $status->delete();
        });

        if ($candidateUsageCount > 0) {
            return to_route('recruiter.candidates.index')->with([
                'status' => 'candidate-status-deleted',
                'message' => "Custom status deleted. Reassigned {$candidateUsageCount} candidate(s) to New.",
            ]);
        }

        return to_route('recruiter.candidates.index')->with('status', 'candidate-status-deleted');
    }

    public function update(UpdateCandidateWorkflowStatusRequest $request, CandidateWorkflowStatus $status): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);
        abort_if($status->is_default, 422, 'Default statuses cannot be edited.');

        $label = $request->validated('label');
        $newKey = Str::of($label)
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->value();

        abort_if($newKey === '', 422, 'Invalid status label.');
        abort_if(
            CandidateWorkflowStatus::query()
                ->where('key', $newKey)
                ->whereKeyNot($status->id)
                ->exists(),
            422,
            'Status already exists.'
        );

        $oldKey = $status->key;

        DB::transaction(function () use ($status, $request, $label, $newKey, $oldKey): void {
            $status->forceFill([
                'key' => $newKey,
                'label' => $label,
                'color' => $request->validated('color', 'gray'),
            ])->save();

            if ($oldKey !== $newKey) {
                CandidateProfile::query()
                    ->where('candidate_status', $oldKey)
                    ->update(['candidate_status' => $newKey]);
            }
        });

        return back()->with('status', 'candidate-status-updated');
    }
}
