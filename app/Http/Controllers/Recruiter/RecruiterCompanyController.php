<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruiter\StoreCompanyRequest;
use App\Http\Requests\Recruiter\UpdateCompanyApplicationReviewRequest;
use App\Models\Company;
use App\Models\CompanyApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterCompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->string('search')->toString());
        $source = $request->string('source')->toString();
        $visibility = $request->string('visibility')->toString();
        $approval = $request->string('approval_status')->toString();

        $companies = Company::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($companyQuery) use ($search): void {
                    $companyQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('job_role', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('website', 'like', "%{$search}%");
                });
            })
            ->when(in_array($source, ['company', 'recruiter'], true), fn ($query) => $query->where('source', $source))
            ->when(in_array($visibility, ['public', 'private'], true), fn ($query) => $query->where('visibility', $visibility))
            ->when(in_array($approval, ['approved', 'pending'], true), fn ($query) => $query->where('approval_status', $approval))
            ->withCount('applications')
            ->with(['createdBy:id,name', 'owner:id,name'])
            ->latest()
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
                'is_active' => (bool) $company->is_active,
                'source' => $company->source,
                'approval_status' => $company->approval_status,
                'visibility' => $company->visibility,
                'applications_count' => $company->applications_count,
                'created_by_name' => $company->createdBy?->name,
                'owner_name' => $company->owner?->name,
                'created_at' => $company->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('recruiter/companies/index', [
            'companies' => [
                'data' => $companies,
            ],
            'filters' => [
                'search' => $search,
                'source' => $source,
                'visibility' => $visibility,
                'approval_status' => $approval,
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(StoreCompanyRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        Company::query()->create([
            'created_by_user_id' => $user->id,
            'approved_by_user_id' => $user->id,
            'source' => 'recruiter',
            'approval_status' => 'approved',
            'visibility' => $request->boolean('is_active', true) ? 'public' : 'private',
            'name' => $request->validated('name'),
            'website' => $request->validated('website'),
            'location' => $request->validated('location'),
            'description' => $request->validated('description'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('status', 'company-enrolled');
    }

    public function show(Request $request, Company $company): Response
    {
        $company->load(['createdBy:id,name', 'owner:id,name']);

        $applications = CompanyApplication::query()
            ->where('company_id', $company->id)
            ->with('candidate:id,name,email')
            ->latest('applied_at')
            ->latest('id')
            ->get()
            ->map(fn (CompanyApplication $application): array => [
                'id' => $application->id,
                'status' => $application->status,
                'review_note' => $application->review_note,
                'applied_at' => $application->applied_at?->toDateTimeString(),
                'cover_letter_preview' => $application->cover_letter !== null
                    ? str($application->cover_letter)->limit(180)->toString()
                    : null,
                'candidate' => [
                    'id' => $application->candidate?->id,
                    'name' => $application->candidate?->name,
                    'email' => $application->candidate?->email,
                ],
            ]);

        return Inertia::render('recruiter/companies/show', [
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
                'is_active' => (bool) $company->is_active,
                'source' => $company->source,
                'approval_status' => $company->approval_status,
                'visibility' => $company->visibility,
                'created_by_name' => $company->createdBy?->name,
                'owner_name' => $company->owner?->name,
                'created_at' => $company->created_at?->toDateTimeString(),
            ],
            'applications' => [
                'data' => $applications,
            ],
        ]);
    }

    public function approve(Request $request, Company $company): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $company->forceFill([
            'approval_status' => 'approved',
            'approved_by_user_id' => $user->id,
            'visibility' => 'public',
            'is_active' => true,
        ])->save();

        return back()->with('status', 'company-approved');
    }

    public function updateVisibility(Request $request, Company $company): RedirectResponse
    {
        $visibility = $request->string('visibility')->toString();
        abort_unless(in_array($visibility, ['public', 'private'], true), 422);

        $isApproved = $company->approval_status === 'approved';

        $company->forceFill([
            'visibility' => $visibility,
            'is_active' => $isApproved && $visibility === 'public',
        ])->save();

        return back()->with('status', 'company-visibility-updated');
    }

    public function destroy(Company $company): RedirectResponse
    {
        $company->delete();

        return to_route('recruiter.companies.index')->with('status', 'company-deleted');
    }

    public function showApplication(Company $company, CompanyApplication $application): Response
    {
        abort_unless($application->company_id === $company->id, 404);

        $application->load([
            'candidate:id,name,email',
            'candidate.candidateProfile:id,user_id,location,university,degree,major,graduation_year',
            'company:id,name,website,location,description,is_active',
        ]);

        return Inertia::render('recruiter/companies/application-show', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'job_role' => $company->job_role,
            ],
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'review_note' => $application->review_note,
                'applied_at' => $application->applied_at?->toDateTimeString(),
                'cover_letter' => $application->cover_letter,
                'candidate' => [
                    'id' => $application->candidate?->id,
                    'name' => $application->candidate?->name,
                    'email' => $application->candidate?->email,
                    'location' => $application->candidate?->candidateProfile?->location,
                    'university' => $application->candidate?->candidateProfile?->university,
                    'degree' => $application->candidate?->candidateProfile?->degree,
                    'major' => $application->candidate?->candidateProfile?->major,
                    'graduation_year' => $application->candidate?->candidateProfile?->graduation_year,
                ],
            ],
        ]);
    }

    public function updateApplication(
        UpdateCompanyApplicationReviewRequest $request,
        Company $company,
        CompanyApplication $application
    ): RedirectResponse {
        abort_unless($application->company_id === $company->id, 404);

        $application->forceFill([
            'status' => $request->validated('status'),
            'review_note' => $request->validated('review_note'),
        ])->save();

        return back()->with('status', 'company-application-updated');
    }
}
