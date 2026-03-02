<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\StoreCompanyRecruitmentRequest;
use App\Http\Requests\Company\UpdateCompanyApplicationReviewRequest;
use App\Http\Requests\Company\UpdateCompanyRecruitmentRequest;
use App\Http\Requests\Company\UpdateCompanyRecruitmentVisibilityRequest;
use App\Models\Company;
use App\Models\CompanyApplication;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyRecruitmentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);

        $recruitments = Company::query()
            ->where('owner_user_id', $user->id)
            ->withCount('applications')
            ->with([
                'applications' => fn ($query) => $query
                    ->with('candidate:id,name,email')
                    ->latest('applied_at'),
            ])
            ->latest()
            ->get()
            ->map(fn (Company $company): array => [
                'id' => $company->id,
                'name' => $company->name,
                'job_role' => $company->job_role,
                'website' => $company->website,
                'location' => $company->location,
                'description' => $company->description,
                'approval_status' => $company->approval_status,
                'visibility' => $company->visibility,
                'is_active' => (bool) $company->is_active,
                'applications_count' => (int) $company->applications_count,
                'applications' => $company->applications->map(fn (CompanyApplication $application): array => [
                    'id' => $application->id,
                    'status' => $application->status,
                    'review_note' => $application->review_note,
                    'applied_at' => $application->applied_at?->toDateTimeString(),
                    'candidate_id' => $application->candidate?->id,
                    'candidate_name' => $application->candidate?->name,
                    'candidate_email' => $application->candidate?->email,
                ])->values(),
            ]);

        return Inertia::render('company/dashboard', [
            'recruitments' => [
                'data' => $recruitments,
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(StoreCompanyRecruitmentRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);

        $jobRole = $request->validated('job_role');

        try {
            Company::query()->create([
                'owner_user_id' => $user->id,
                'name' => $this->generateUniqueRecruitmentName($user, $jobRole),
                'job_role' => $jobRole,
                'website' => $request->validated('website'),
                'location' => $request->validated('location'),
                'description' => $request->validated('description'),
                'source' => 'company',
                'approval_status' => 'pending',
                'visibility' => 'private',
                'is_active' => false,
            ]);
        } catch (UniqueConstraintViolationException) {
            return back()
                ->withInput()
                ->withErrors([
                    'job_role' => 'Could not create this recruitment right now. Please try again.',
                ]);
        }

        return back()->with('status', 'company-recruitment-created');
    }

    public function show(Request $request, Company $company): Response
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);
        abort_unless($company->owner_user_id === $user->id, 403);

        $applications = CompanyApplication::query()
            ->where('company_id', $company->id)
            ->with('candidate:id,name,email')
            ->latest('applied_at')
            ->get()
            ->map(fn (CompanyApplication $application): array => [
                'id' => $application->id,
                'status' => $application->status,
                'review_note' => $application->review_note,
                'applied_at' => $application->applied_at?->toDateTimeString(),
                'candidate_id' => $application->candidate?->id,
                'candidate_name' => $application->candidate?->name,
                'candidate_email' => $application->candidate?->email,
            ]);

        return Inertia::render('company/recruitment-show', [
            'recruitment' => [
                'id' => $company->id,
                'name' => $company->name,
                'job_role' => $company->job_role,
                'website' => $company->website,
                'location' => $company->location,
                'description' => $company->description,
                'approval_status' => $company->approval_status,
                'visibility' => $company->visibility,
                'applications_count' => (int) $company->applications()->count(),
                'applications' => $applications,
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    public function updateVisibility(UpdateCompanyRecruitmentVisibilityRequest $request, Company $company): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);
        abort_unless($company->owner_user_id === $user->id, 403);

        $visibility = $request->validated('visibility');
        $isApproved = $company->approval_status === 'approved';

        $company->forceFill([
            'visibility' => $visibility,
            'is_active' => $isApproved && $visibility === 'public',
        ])->save();

        return back()->with('status', 'company-recruitment-visibility-updated');
    }

    public function update(UpdateCompanyRecruitmentRequest $request, Company $company): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);
        abort_unless($company->owner_user_id === $user->id, 403);

        $jobRole = $request->validated('job_role');

        try {
            $company->forceFill([
                'name' => $this->generateUniqueRecruitmentName($user, $jobRole, $company->id),
                'job_role' => $jobRole,
                'website' => $request->validated('website'),
                'location' => $request->validated('location'),
                'description' => $request->validated('description'),
            ])->save();
        } catch (UniqueConstraintViolationException) {
            return back()
                ->withInput()
                ->withErrors([
                    'job_role' => 'Could not update this recruitment right now. Please try again.',
                ]);
        }

        return back()->with('status', 'company-recruitment-updated');
    }

    public function destroy(Request $request, Company $company): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);
        abort_unless($company->owner_user_id === $user->id, 403);

        $company->delete();

        return to_route('company.dashboard')->with('status', 'company-recruitment-deleted');
    }

    public function destroyApplication(Request $request, Company $company, CompanyApplication $application): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);
        abort_unless($company->owner_user_id === $user->id, 403);
        abort_unless($application->company_id === $company->id, 404);

        $application->delete();

        return back()->with('status', 'company-application-deleted');
    }

    public function updateApplication(
        UpdateCompanyApplicationReviewRequest $request,
        Company $company,
        CompanyApplication $application
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);
        abort_unless($company->owner_user_id === $user->id, 403);
        abort_unless($application->company_id === $company->id, 404);

        $application->forceFill([
            'status' => $request->validated('status'),
            'review_note' => $request->validated('review_note'),
        ])->save();

        return back()->with('status', 'company-application-updated');
    }

    public function showApplication(Request $request, Company $company, CompanyApplication $application): Response
    {
        $user = $request->user();
        abort_unless($user !== null && $user->isCompany(), 403);
        abort_unless($company->owner_user_id === $user->id, 403);
        abort_unless($application->company_id === $company->id, 404);

        $application->load([
            'candidate:id,name,email',
            'candidate.candidateProfile:id,user_id,location,university,degree,major,graduation_year',
        ]);

        return Inertia::render('company/application-show', [
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

    private function generateUniqueRecruitmentName(User $user, string $jobRole, ?int $ignoreCompanyId = null): string
    {
        $baseName = trim($user->name.' - '.$jobRole);
        $candidateName = $baseName;
        $suffix = 2;

        while ($this->recruitmentNameExists($candidateName, $ignoreCompanyId)) {
            $candidateName = $baseName.' ('.$suffix.')';
            $suffix++;
        }

        return $candidateName;
    }

    private function recruitmentNameExists(string $name, ?int $ignoreCompanyId = null): bool
    {
        $query = Company::query()->where('name', $name);

        if ($ignoreCompanyId !== null) {
            $query->where('id', '!=', $ignoreCompanyId);
        }

        return $query->exists();
    }
}
