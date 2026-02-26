<?php

use App\Http\Controllers\Candidate\ResumeController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'show'])->name('dashboard');

    Route::get('candidate/resume', [ResumeController::class, 'edit'])
        ->name('candidate.resume.edit');
    Route::post('candidate/resume', [ResumeController::class, 'store'])
        ->name('candidate.resume.store');
    Route::get('candidate/resume/{resume}', [ResumeController::class, 'show'])
        ->name('candidate.resume.show');
});

require __DIR__.'/settings.php';
