<?php

use App\Http\Controllers\Candidate\OnboardingController;
use App\Http\Controllers\Candidate\ResumeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Recruiter\RecruiterCandidateController;
use App\Http\Controllers\Recruiter\RecruiterCollectionController;
use App\Http\Controllers\Recruiter\RecruiterDashboardController;
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

    Route::get('candidate/resume', [ResumeController::class, 'edit'])
        ->name('candidate.resume.edit');
    Route::post('candidate/resume', [ResumeController::class, 'store'])
        ->name('candidate.resume.store');
    Route::get('candidate/resume/{resume}', [ResumeController::class, 'show'])
        ->name('candidate.resume.show');
});

Route::middleware(['auth', 'role:admin'])->prefix('recruiter')->name('recruiter.')->group(function (): void {
    Route::get('dashboard', [RecruiterDashboardController::class, 'index'])->name('dashboard');

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
});

require __DIR__.'/settings.php';
