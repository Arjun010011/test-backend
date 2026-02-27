<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param  list<string>  $roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $allowedRoles = array_map(static fn (string $role): string => strtolower(trim($role)), $roles);

        if ($user->isAdmin() && in_array('admin', $allowedRoles, true)) {
            return $next($request);
        }

        if ($user->isCandidate() && in_array('candidate', $allowedRoles, true)) {
            return $next($request);
        }

        abort(403);
    }
}
