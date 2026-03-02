<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyApplication;
use App\Services\RecruiterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterDashboardController extends Controller
{
    public function index(Request $request, RecruiterService $recruiterService): Response|RedirectResponse
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

    public function analytics(Request $request, RecruiterService $recruiterService): Response|RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        if ($user->isCandidate()) {
            return redirect()->route('dashboard');
        }

        $stats = $recruiterService->dashboardStats($user);

        $applicationsByStatus = CompanyApplication::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn (CompanyApplication $application): array => [
                'status' => $application->status,
                'total' => (int) $application->getAttribute('total'),
            ])
            ->values();

        $topCompanies = Company::query()
            ->withCount('applications')
            ->orderByDesc('applications_count')
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(fn (Company $company): array => [
                'id' => $company->id,
                'name' => $company->name,
                'applications_count' => (int) $company->applications_count,
            ])
            ->values();

        $rangeStart = now()->startOfMonth()->subMonths(5);
        $monthlyCounts = CompanyApplication::query()
            ->where('applied_at', '>=', $rangeStart)
            ->get(['applied_at'])
            ->groupBy(fn (CompanyApplication $application): ?string => $application->applied_at?->format('Y-m'))
            ->map(fn ($applications): int => $applications->count());

        $applicationTrend = collect(range(0, 5))
            ->map(function (int $index) use ($rangeStart, $monthlyCounts): array {
                $month = (clone $rangeStart)->addMonths($index);
                $monthKey = $month->format('Y-m');

                return [
                    'month' => $month->format('M Y'),
                    'total' => (int) ($monthlyCounts->get($monthKey) ?? 0),
                ];
            })
            ->values();

        return Inertia::render('recruiter/analytics', [
            'summary' => [
                'total_candidates' => $stats['total_candidates'],
                'starred_candidates' => $stats['starred_candidates'],
                'active_collections' => $stats['active_collections'],
                'companies' => Company::query()->count(),
                'active_companies' => Company::query()->where('is_active', true)->count(),
                'applications' => CompanyApplication::query()->count(),
            ],
            'breakdown' => [
                'applications_by_status' => $applicationsByStatus,
                'top_companies' => $topCompanies,
                'application_trend' => $applicationTrend,
            ],
        ]);
    }
}
