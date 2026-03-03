<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\ApplyCompanyRequest;
use App\Models\Company;
use App\Models\CompanyApplication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateCompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));

        abort_unless($user !== null, 403);

        $appliedCompanyIds = $user->companyApplications()
            ->pluck('company_id')
            ->all();

        $companies = Company::query()
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->where('visibility', 'public')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('job_role', 'like', "%{$search}%");
                });
            })
            ->withCount('applications')
            ->orderBy('name')
            ->get()
            ->map(fn (Company $company): array => [
                'id' => $company->id,
                'name' => $company->name,
                'job_role' => $company->job_role,
                'website' => $company->website,
                'location' => $company->location,
                'description' => $company->description,
                'salary_min_lpa' => $company->salary_min_lpa !== null ? (float) $company->salary_min_lpa : null,
                'salary_max_lpa' => $company->salary_max_lpa !== null ? (float) $company->salary_max_lpa : null,
                'experience_min_years' => $company->experience_min_years !== null ? (float) $company->experience_min_years : null,
                'experience_max_years' => $company->experience_max_years !== null ? (float) $company->experience_max_years : null,
                'employment_type' => $company->employment_type,
                'work_mode' => $company->work_mode,
                'openings' => $company->openings,
                'skills_required' => $company->skills_required,
                'application_deadline' => $company->application_deadline?->toDateString(),
                'applications_count' => $company->applications_count,
                'has_applied' => in_array($company->id, $appliedCompanyIds, true),
            ]);

        return Inertia::render('candidate/companies/index', [
            'companies' => [
                'data' => $companies,
            ],
            'filters' => [
                'search' => $search,
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    public function apply(ApplyCompanyRequest $request, Company $company): RedirectResponse
    {
        abort_if(! $company->is_active, 404);

        $user = $request->user();

        abort_unless($user !== null, 403);

        $application = CompanyApplication::query()->firstOrCreate(
            [
                'company_id' => $company->id,
                'candidate_user_id' => $user->id,
            ],
            [
                'cover_letter' => $request->validated('cover_letter'),
                'status' => 'submitted',
                'applied_at' => now(),
            ],
        );

        return back()->with(
            'status',
            $application->wasRecentlyCreated ? 'company-application-submitted' : 'company-application-exists',
        );
    }

    public function show(Request $request, Company $company): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $company = Company::query()
            ->whereKey($company->id)
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->where('visibility', 'public')
            ->withCount('applications')
            ->firstOrFail();

        return Inertia::render('candidate/companies/show', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'job_role' => $company->job_role,
                'website' => $company->website,
                'location' => $company->location,
                'description' => $company->description,
                'salary_min_lpa' => $company->salary_min_lpa !== null ? (float) $company->salary_min_lpa : null,
                'salary_max_lpa' => $company->salary_max_lpa !== null ? (float) $company->salary_max_lpa : null,
                'experience_min_years' => $company->experience_min_years !== null ? (float) $company->experience_min_years : null,
                'experience_max_years' => $company->experience_max_years !== null ? (float) $company->experience_max_years : null,
                'employment_type' => $company->employment_type,
                'work_mode' => $company->work_mode,
                'openings' => $company->openings,
                'skills_required' => $company->skills_required,
                'application_deadline' => $company->application_deadline?->toDateString(),
                'applications_count' => $company->applications_count,
                'has_applied' => $user->companyApplications()->where('company_id', $company->id)->exists(),
            ],
            'status' => $request->session()->get('status'),
        ]);
    }
}
