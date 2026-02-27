<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\CandidateProfile;
use App\Models\User;

class CandidateProfilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isSuperAdmin();
    }

    public function view(User $user, CandidateProfile $candidateProfile): bool
    {
        if (! $this->viewAny($user) || $candidateProfile->user?->role !== Role::Candidate) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        return $candidateProfile->profile_completed_at !== null;
    }

    public function update(User $user, CandidateProfile $candidateProfile): bool
    {
        return $this->view($user, $candidateProfile);
    }
}
