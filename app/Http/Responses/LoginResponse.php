<?php

namespace App\Http\Responses;

use App\Enums\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        $user = auth()->user();

        // Determine redirect destination based on role
        $redirectTo = match ($user?->role) {
            Role::Admin, Role::SuperAdmin => route('recruiter.dashboard'),
            Role::Company => route('company.dashboard'),
            Role::Candidate => config('fortify.home', '/dashboard'),
            default => config('fortify.home', '/dashboard'),
        };

        return redirect()->intended($redirectTo);
    }
}
