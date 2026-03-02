<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruiter\StoreCandidateWorkflowStatusRequest;
use App\Models\CandidateWorkflowStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        abort_if($status->is_default, 422, 'Default statuses cannot be deleted.');

        $isUsed = \App\Models\CandidateProfile::query()
            ->where('candidate_status', $status->key)
            ->exists();

        abort_if($isUsed, 422, 'Cannot delete a status currently in use.');

        $status->delete();

        return back()->with('status', 'candidate-status-deleted');
    }
}
