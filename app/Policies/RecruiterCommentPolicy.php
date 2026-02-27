<?php

namespace App\Policies;

use App\Models\RecruiterComment;
use App\Models\User;

class RecruiterCommentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isSuperAdmin();
    }

    public function view(User $user, RecruiterComment $recruiterComment): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $user->isSuperAdmin() || $recruiterComment->recruiter_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, RecruiterComment $recruiterComment): bool
    {
        return $this->view($user, $recruiterComment);
    }

    public function delete(User $user, RecruiterComment $recruiterComment): bool
    {
        return $this->view($user, $recruiterComment);
    }
}
