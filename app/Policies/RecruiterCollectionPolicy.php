<?php

namespace App\Policies;

use App\Models\RecruiterCollection;
use App\Models\User;

class RecruiterCollectionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isSuperAdmin();
    }

    public function view(User $user, RecruiterCollection $recruiterCollection): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $user->isSuperAdmin() || $recruiterCollection->recruiter_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, RecruiterCollection $recruiterCollection): bool
    {
        return $this->view($user, $recruiterCollection);
    }

    public function delete(User $user, RecruiterCollection $recruiterCollection): bool
    {
        return $this->view($user, $recruiterCollection);
    }
}
