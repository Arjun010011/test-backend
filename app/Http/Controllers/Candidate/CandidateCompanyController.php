<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\ApplyCompanyRequest;
use App\Models\Company;
use App\Models\CompanyApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateCompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $appliedCompanyIds = $user->companyApplications()
            ->pluck('company_id')
            ->all();

        $companies = Company::query()
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->where('visibility', 'public')
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
                'applications_count' => $company->applications_count,
                'has_applied' => in_array($company->id, $appliedCompanyIds, true),
            ]);

        return Inertia::render('candidate/companies/index', [
            'companies' => [
                'data' => $companies,
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
}
