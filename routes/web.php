<?php

use App\Http\Controllers\Candidate\AssessmentController as CandidateAssessmentController;
use App\Http\Controllers\Candidate\CandidateCompanyController;
use App\Http\Controllers\Candidate\OnboardingController;
use App\Http\Controllers\Candidate\ResumeController;
use App\Http\Controllers\Company\CompanyRecruitmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Recruiter\AssessmentAnalyticsController;
use App\Http\Controllers\Recruiter\AssessmentController as RecruiterAssessmentController;
use App\Http\Controllers\Recruiter\RecruiterCandidateController;
use App\Http\Controllers\Recruiter\RecruiterCollectionController;
use App\Http\Controllers\Recruiter\RecruiterCompanyController;
use App\Http\Controllers\Recruiter\RecruiterDashboardController;
use App\Http\Controllers\Recruiter\RecruiterStatusController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified', 'candidate.onboarding'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'show'])->name('dashboard');

    Route::get('candidate/onboarding', [OnboardingController::class, 'edit'])
        ->name('candidate.onboarding.edit');
    Route::post('candidate/onboarding', [OnboardingController::class, 'store'])
        ->name('candidate.onboarding.store');
    Route::post('candidate/onboarding/profile-photo', [OnboardingController::class, 'updateProfilePhoto'])
        ->name('candidate.onboarding.photo.update');

    Route::get('candidate/resume', [ResumeController::class, 'edit'])
        ->name('candidate.resume.edit');
    Route::post('candidate/resume', [ResumeController::class, 'store'])
        ->name('candidate.resume.store');
    Route::get('candidate/resume/{resume}', [ResumeController::class, 'show'])
        ->name('candidate.resume.show');

    Route::get('candidate/companies', [CandidateCompanyController::class, 'index'])
        ->name('candidate.companies.index');
    Route::get('candidate/companies/{company}', [CandidateCompanyController::class, 'show'])
        ->name('candidate.companies.show');
    Route::post('candidate/companies/{company}/apply', [CandidateCompanyController::class, 'apply'])
        ->name('candidate.companies.apply');
});

Route::middleware(['auth', 'role:admin'])->prefix('recruiter')->name('recruiter.')->group(function (): void {
    Route::get('dashboard', [RecruiterDashboardController::class, 'index'])->name('dashboard');
    Route::get('analytics', [RecruiterDashboardController::class, 'analytics'])->name('analytics');

    Route::get('candidates', [RecruiterCandidateController::class, 'index'])->name('candidates.index');
    Route::get('candidates/{candidate}', [RecruiterCandidateController::class, 'show'])->name('candidates.show');
    Route::patch('candidates/{candidate}/status', [RecruiterCandidateController::class, 'updateStatus'])->name('candidates.status.update');
    Route::put('candidates/{candidate}', [RecruiterCandidateController::class, 'update'])->name('candidates.update');
    Route::delete('candidates/{candidate}', [RecruiterCandidateController::class, 'destroy'])->name('candidates.destroy');
    Route::post('candidates/{candidate}/comments', [RecruiterCandidateController::class, 'storeComment'])->name('candidates.comments.store');
    Route::put('candidates/{candidate}/comments/{comment}', [RecruiterCandidateController::class, 'updateComment'])->name('candidates.comments.update');
    Route::delete('candidates/{candidate}/comments/{comment}', [RecruiterCandidateController::class, 'destroyComment'])->name('candidates.comments.destroy');
    Route::post('candidates/{candidate}/star', [RecruiterCandidateController::class, 'toggleStar'])->name('candidates.star.toggle');
    Route::post('candidates/{candidate}/collections', [RecruiterCandidateController::class, 'attachToCollection'])->name('candidates.collections.attach');
    Route::delete('candidates/{candidate}/collections/{collection}', [RecruiterCandidateController::class, 'removeFromCollection'])->name('candidates.collections.remove');
    Route::get('candidates/{candidate}/resume', [RecruiterCandidateController::class, 'downloadResume'])->name('candidates.resume.download');

    Route::get('collections', [RecruiterCollectionController::class, 'index'])->name('collections.index');
    Route::post('collections', [RecruiterCollectionController::class, 'store'])->name('collections.store');
    Route::put('collections/{collection}', [RecruiterCollectionController::class, 'update'])->name('collections.update');
    Route::delete('collections/{collection}', [RecruiterCollectionController::class, 'destroy'])->name('collections.destroy');
    Route::get('collections/{collection}', [RecruiterCollectionController::class, 'show'])->name('collections.show');

    Route::get('companies', [RecruiterCompanyController::class, 'index'])->name('companies.index');
    Route::post('companies', [RecruiterCompanyController::class, 'store'])->name('companies.store');
    Route::patch('companies/{company}/approve', [RecruiterCompanyController::class, 'approve'])->name('companies.approve');
    Route::patch('companies/{company}/visibility', [RecruiterCompanyController::class, 'updateVisibility'])->name('companies.visibility.update');
    Route::delete('companies/{company}', [RecruiterCompanyController::class, 'destroy'])->name('companies.destroy');
    Route::get('companies/{company}', [RecruiterCompanyController::class, 'show'])->name('companies.show');
    Route::get('companies/{company}/applications/{application}', [RecruiterCompanyController::class, 'showApplication'])->name('companies.applications.show');
    Route::patch('companies/{company}/applications/{application}', [RecruiterCompanyController::class, 'updateApplication'])->name('companies.applications.update');

    Route::post('statuses', [RecruiterStatusController::class, 'store'])->name('statuses.store');
    Route::patch('statuses/{status}', [RecruiterStatusController::class, 'update'])->name('statuses.update');
    Route::delete('statuses/{status}', [RecruiterStatusController::class, 'destroy'])->name('statuses.destroy');

    Route::resource('assessments', RecruiterAssessmentController::class)
        ->only(['index', 'create', 'store', 'show', 'destroy']);
    Route::post('assessments/{assessment}/toggle-status', [RecruiterAssessmentController::class, 'toggleStatus'])
        ->name('assessments.toggle-status');
    Route::get('assessments/{assessment}/analytics', [AssessmentAnalyticsController::class, 'show'])
        ->name('assessments.analytics');
});

Route::middleware(['auth', 'verified', 'candidate.onboarding', 'role:candidate'])
    ->prefix('candidate')
    ->name('candidate.')
    ->group(function (): void {
        Route::get('assessments', [CandidateAssessmentController::class, 'index'])->name('assessments.index');
        Route::get('assessments/{assessment}', [CandidateAssessmentController::class, 'show'])->name('assessments.show');
        Route::post('assessments/{assessment}/start', [CandidateAssessmentController::class, 'start'])->name('assessments.start');
        Route::get('assessments/{assessment}/take', [CandidateAssessmentController::class, 'take'])->name('assessments.take');
        Route::post('assessments/{assessment}/answer', [CandidateAssessmentController::class, 'saveAnswer'])->name('assessments.answer');
        Route::post('assessments/{assessment}/proctor-events', [CandidateAssessmentController::class, 'storeProctoringEvent'])->name('assessments.proctor-events.store');
        Route::post('assessments/{assessment}/submit', [CandidateAssessmentController::class, 'submit'])->name('assessments.submit');
        Route::get('assessments/{assessment}/result', [CandidateAssessmentController::class, 'result'])->name('assessments.result');
    });

Route::middleware(['auth', 'verified', 'role:company'])->prefix('company')->name('company.')->group(function (): void {
    Route::get('dashboard', [CompanyRecruitmentController::class, 'index'])->name('dashboard');
    Route::post('recruitments', [CompanyRecruitmentController::class, 'store'])->name('recruitments.store');
    Route::get('recruitments/{company}', [CompanyRecruitmentController::class, 'show'])->name('recruitments.show');
    Route::patch('recruitments/{company}', [CompanyRecruitmentController::class, 'update'])->name('recruitments.update');
    Route::patch('recruitments/{company}/visibility', [CompanyRecruitmentController::class, 'updateVisibility'])->name('recruitments.visibility.update');
    Route::delete('recruitments/{company}', [CompanyRecruitmentController::class, 'destroy'])->name('recruitments.destroy');
    Route::get('recruitments/{company}/applications/{application}', [CompanyRecruitmentController::class, 'showApplication'])->name('recruitments.applications.show');
    Route::delete('recruitments/{company}/applications/{application}', [CompanyRecruitmentController::class, 'destroyApplication'])->name('recruitments.applications.destroy');
    Route::patch('recruitments/{company}/applications/{application}', [CompanyRecruitmentController::class, 'updateApplication'])->name('recruitments.applications.update');
});

require __DIR__.'/settings.php';
