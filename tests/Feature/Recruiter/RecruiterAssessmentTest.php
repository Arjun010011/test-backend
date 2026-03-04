<?php

use App\Models\Assessment;
use App\Models\User;
use App\Services\QuestionProviderService;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

it('allows admins to create an assessment with generated questions', function () {
    $admin = User::factory()->admin()->create();

    $questionProvider = Mockery::mock(QuestionProviderService::class);
    $questionProvider->shouldReceive('getAvailableTopics')
        ->atLeast()
        ->once()
        ->andReturn([
            'logical_reasoning_analytical_ability' => 'Logical Reasoning (Analytical Ability)',
        ]);

    $questionProvider->shouldReceive('generateQuestionsFromBlueprint')
        ->once()
        ->with([
            [
                'topic' => 'logical_reasoning_analytical_ability',
                'easy_count' => 5,
                'medium_count' => 0,
                'hard_count' => 0,
            ],
        ])
        ->andReturn([
            [
                'question_text' => 'What is O(log n)?',
                'question_type' => 'multiple_choice',
                'category' => 'logical_reasoning_analytical_ability',
                'difficulty' => 'easy',
                'points' => 1,
                'source' => 'template',
                'options' => [
                    ['option_text' => 'Binary search', 'is_correct' => true],
                    ['option_text' => 'Bubble sort', 'is_correct' => false],
                ],
            ],
            [
                'question_text' => 'What does SQL stand for?',
                'question_type' => 'multiple_choice',
                'category' => 'logical_reasoning_analytical_ability',
                'difficulty' => 'easy',
                'points' => 1,
                'source' => 'template',
                'options' => [
                    ['option_text' => 'Structured Query Language', 'is_correct' => true],
                    ['option_text' => 'Simple Query Language', 'is_correct' => false],
                ],
            ],
            [
                'question_text' => 'Pick LIFO structure',
                'question_type' => 'multiple_choice',
                'category' => 'logical_reasoning_analytical_ability',
                'difficulty' => 'easy',
                'points' => 1,
                'source' => 'template',
                'options' => [
                    ['option_text' => 'Stack', 'is_correct' => true],
                    ['option_text' => 'Queue', 'is_correct' => false],
                ],
            ],
            [
                'question_text' => 'One more question',
                'question_type' => 'multiple_choice',
                'category' => 'logical_reasoning_analytical_ability',
                'difficulty' => 'easy',
                'points' => 1,
                'source' => 'template',
                'options' => [
                    ['option_text' => 'A', 'is_correct' => true],
                    ['option_text' => 'B', 'is_correct' => false],
                ],
            ],
            [
                'question_text' => 'Final question',
                'question_type' => 'multiple_choice',
                'category' => 'logical_reasoning_analytical_ability',
                'difficulty' => 'easy',
                'points' => 1,
                'source' => 'template',
                'options' => [
                    ['option_text' => 'X', 'is_correct' => true],
                    ['option_text' => 'Y', 'is_correct' => false],
                ],
            ],
        ]);

    $this->instance(QuestionProviderService::class, $questionProvider);

    actingAs($admin)
        ->post(route('recruiter.assessments.store'), [
            'title' => 'CS Basics',
            'description' => 'Quick fundamentals check',
            'duration_minutes' => 45,
            'passing_score' => 60,
            'randomize_questions' => false,
            'show_results_immediately' => true,
            'status' => 'active',
            'question_blueprint' => [
                [
                    'topic' => 'logical_reasoning_analytical_ability',
                    'easy_count' => 5,
                    'medium_count' => 0,
                    'hard_count' => 0,
                ],
            ],
        ])
        ->assertRedirect();

    $assessment = Assessment::query()->firstOrFail();

    expect($assessment->title)->toBe('CS Basics')
        ->and($assessment->status)->toBe('active')
        ->and($assessment->is_active)->toBeTrue()
        ->and($assessment->total_questions)->toBe(5)
        ->and($assessment->difficulty)->toBe('mixed')
        ->and($assessment->questions()->count())->toBe(5)
        ->and($assessment->questions()->firstOrFail()->options()->count())->toBe(2);
});

it('shows assessment index for admins', function () {
    $admin = User::factory()->admin()->create();

    Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'Algorithms Test',
        'description' => null,
        'category' => 'algorithms',
        'difficulty' => 'medium',
        'duration_minutes' => 30,
        'total_questions' => 10,
        'passing_score' => 60,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'is_active' => true,
        'published_at' => now(),
    ]);

    actingAs($admin)
        ->get(route('recruiter.assessments.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('recruiter/assessments/index')
            ->where('assessments.data.0.title', 'Algorithms Test')
        );
});

it('blocks candidate users from recruiter assessment routes', function () {
    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->get(route('recruiter.assessments.index'))
        ->assertForbidden();
});

it('allows recruiter to update assessment status to private', function () {
    $admin = User::factory()->admin()->create();

    $assessment = Assessment::query()->create([
        'created_by' => $admin->id,
        'title' => 'DSA Screening',
        'description' => null,
        'category' => 'algorithms',
        'difficulty' => 'medium',
        'duration_minutes' => 45,
        'total_questions' => 10,
        'passing_score' => 60,
        'randomize_questions' => true,
        'show_results_immediately' => true,
        'status' => 'active',
        'is_active' => true,
        'published_at' => now(),
    ]);

    actingAs($admin)
        ->post(route('recruiter.assessments.toggle-status', $assessment), [
            'status' => 'private',
        ])
        ->assertRedirect();

    $assessment->refresh();

    expect($assessment->status)->toBe('private')
        ->and($assessment->is_active)->toBeFalse()
        ->and($assessment->published_at)->toBeNull();
});
