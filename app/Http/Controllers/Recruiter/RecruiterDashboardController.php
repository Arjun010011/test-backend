<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Services\RecruiterService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterDashboardController extends Controller
{
    public function index(Request $request, RecruiterService $recruiterService): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        if ($user->role === \App\Enums\Role::Candidate) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('recruiter/dashboard', [
            'stats' => $recruiterService->dashboardStats($user),
            'status' => $request->session()->get('status'),
        ]);
    }
}
