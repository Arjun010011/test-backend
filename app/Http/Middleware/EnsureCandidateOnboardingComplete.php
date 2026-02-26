<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCandidateOnboardingComplete
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->isCandidate()) {
            return $next($request);
        }

        if ($request->routeIs('candidate.onboarding.*')) {
            return $next($request);
        }

        $profile = $user->candidateProfile;

        if ($profile?->profile_completed_at !== null) {
            return $next($request);
        }

        return redirect()->route('candidate.onboarding.edit');
    }
}
