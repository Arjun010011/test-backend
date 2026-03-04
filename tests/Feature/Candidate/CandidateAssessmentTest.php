<?php

use App\Models\Assessment;
use App\Models\AssessmentAssignment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentProctoringEvent;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentQuestionOption;
use App\Models\CandidateProfile;
use App\Models\User;

use function Pest\Laravel\actingAs;

it('allows a candidate to start answer and submit an assigned assessment', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'university' => 'ABC Engineering College',
        'profile_completed_at' => now(),
    ]);

    $assessment = Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Data Structures Test',
        'description' => null,
        'category' => 'data_structures',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 50,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'is_active' => true,
        'published_at' => now(),
    ]);

    $question = AssessmentQuestion::query()->create([
        'assessment_id' => $assessment->id,
        'question_text' => 'Stack follows?',
        'question_type' => 'multiple_choice',
        'category' => 'data_structures',
        'difficulty' => 'easy',
        'points' => 5,
        'source' => 'template',
    ]);

    $correctOption = AssessmentQuestionOption::query()->create([
        'question_id' => $question->id,
        'option_text' => 'LIFO',
        'is_correct' => true,
        'display_order' => 1,
    ]);

    AssessmentQuestionOption::query()->create([
        'question_id' => $question->id,
        'option_text' => 'FIFO',
        'is_correct' => false,
        'display_order' => 2,
    ]);

    AssessmentAssignment::query()->create([
        'assessment_id' => $assessment->id,
        'college_name' => 'ABC Engineering College',
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
        'max_attempts' => 1,
        'is_active' => true,
    ]);

    actingAs($candidate)
        ->post(route('candidate.assessments.start', $assessment))
        ->assertRedirect(route('candidate.assessments.take', $assessment));

    $attempt = AssessmentAttempt::query()->firstOrFail();

    expect($attempt->status)->toBe('in_progress');

    actingAs($candidate)
        ->postJson(route('candidate.assessments.answer', $assessment), [
            'question_id' => $question->id,
            'selected_option_id' => $correctOption->id,
        ])
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    actingAs($candidate)
        ->post(route('candidate.assessments.submit', $assessment))
        ->assertRedirect(route('candidate.assessments.result', $assessment));

    $attempt->refresh();

    expect($attempt->status)->toBe('submitted')
        ->and((int) $attempt->score)->toBe(5)
        ->and((int) $attempt->max_score)->toBe(5)
        ->and((float) $attempt->percentage)->toBe(100.0);
});

it('awards zero points for incorrect answers', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'university' => 'ABC Engineering College',
        'profile_completed_at' => now(),
    ]);

    $assessment = Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Incorrect Answer Test',
        'description' => null,
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 50,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'is_active' => true,
        'published_at' => now(),
    ]);

    $question = AssessmentQuestion::query()->create([
        'assessment_id' => $assessment->id,
        'question_text' => 'What is 10 / 2?',
        'question_type' => 'multiple_choice',
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'points' => 5,
        'source' => 'template',
    ]);

    AssessmentQuestionOption::query()->create([
        'question_id' => $question->id,
        'option_text' => '5',
        'is_correct' => true,
        'display_order' => 1,
    ]);

    $wrongOption = AssessmentQuestionOption::query()->create([
        'question_id' => $question->id,
        'option_text' => '8',
        'is_correct' => false,
        'display_order' => 2,
    ]);

    AssessmentAssignment::query()->create([
        'assessment_id' => $assessment->id,
        'college_name' => 'ABC Engineering College',
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
        'max_attempts' => 1,
        'is_active' => true,
    ]);

    actingAs($candidate)
        ->post(route('candidate.assessments.start', $assessment))
        ->assertRedirect(route('candidate.assessments.take', $assessment));

    actingAs($candidate)
        ->postJson(route('candidate.assessments.answer', $assessment), [
            'question_id' => $question->id,
            'selected_option_id' => $wrongOption->id,
        ])
        ->assertSuccessful();

    actingAs($candidate)
        ->post(route('candidate.assessments.submit', $assessment))
        ->assertRedirect(route('candidate.assessments.result', $assessment));

    $attempt = AssessmentAttempt::query()->latest('id')->firstOrFail();

    expect($attempt->status)->toBe('submitted')
        ->and((int) $attempt->score)->toBe(0)
        ->and((int) $attempt->max_score)->toBe(5)
        ->and((float) $attempt->percentage)->toBe(0.0);
});

it('shows onboarding message when candidate has no college set', function () {
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'university' => null,
        'profile_completed_at' => now(),
    ]);

    actingAs($candidate)
        ->get(route('candidate.assessments.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/assessments/index')
            ->where('college', null)
        );
});

it('blocks candidate access when assigned assessment window has ended', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'university' => 'ABC Engineering College',
        'profile_completed_at' => now(),
    ]);

    $assessment = Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Expired Assignment Test',
        'description' => null,
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 50,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'is_active' => true,
        'published_at' => now(),
    ]);

    AssessmentQuestion::query()->create([
        'assessment_id' => $assessment->id,
        'question_text' => '2 + 2 = ?',
        'question_type' => 'multiple_choice',
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'points' => 1,
        'source' => 'template',
    ]);

    AssessmentAssignment::query()->create([
        'assessment_id' => $assessment->id,
        'college_name' => 'ABC Engineering College',
        'starts_at' => now()->subDays(2),
        'ends_at' => now()->subHour(),
        'max_attempts' => 1,
        'is_active' => true,
    ]);

    actingAs($candidate)
        ->get(route('candidate.assessments.show', $assessment))
        ->assertForbidden();
});

it('stores proctoring events for in-progress attempts', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'university' => 'ABC Engineering College',
        'profile_completed_at' => now(),
    ]);

    $assessment = Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Proctoring Test',
        'description' => null,
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 50,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'is_active' => true,
        'published_at' => now(),
    ]);

    $assignment = AssessmentAssignment::query()->create([
        'assessment_id' => $assessment->id,
        'college_name' => 'ABC Engineering College',
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
        'max_attempts' => 1,
        'is_active' => true,
    ]);

    $attempt = AssessmentAttempt::query()->create([
        'assessment_id' => $assessment->id,
        'candidate_id' => $candidate->id,
        'assignment_id' => $assignment->id,
        'attempt_number' => 1,
        'started_at' => now(),
        'max_score' => 10,
        'status' => 'in_progress',
    ]);

    actingAs($candidate)
        ->postJson(route('candidate.assessments.proctor-events.store', $assessment), [
            'event_type' => 'tab_hidden',
            'severity' => 'high',
            'metadata' => [
                'source' => 'browser',
            ],
            'occurred_at' => now()->toIso8601String(),
        ])
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $event = AssessmentProctoringEvent::query()->firstOrFail();

    expect($event->assessment_id)->toBe($assessment->id)
        ->and($event->attempt_id)->toBe($attempt->id)
        ->and($event->candidate_id)->toBe($candidate->id)
        ->and($event->event_type)->toBe('tab_hidden')
        ->and($event->severity)->toBe('high');
});

it('hides draft and private assessments from candidates', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'university' => 'ABC Engineering College',
        'profile_completed_at' => now(),
    ]);

    Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Active Assessment',
        'description' => null,
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 50,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'status' => 'active',
        'is_active' => true,
        'published_at' => now(),
    ]);

    Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Private Assessment',
        'description' => null,
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 50,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'status' => 'private',
        'is_active' => false,
        'published_at' => null,
    ]);

    Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Draft Assessment',
        'description' => null,
        'category' => 'aptitude',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 50,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'status' => 'draft',
        'is_active' => false,
        'published_at' => null,
    ]);

    actingAs($candidate)
        ->get(route('candidate.assessments.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/assessments/index')
            ->where('assessments.0.assessment.title', 'Active Assessment')
            ->missing('assessments.1')
        );
});
