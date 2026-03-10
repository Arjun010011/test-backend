<?php

use App\Enums\Role;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentQuestionTestCase;
use App\Models\AssessmentResponse;
use App\Models\CandidateProfile;
use App\Models\User;
use App\Services\Judge\JudgeClient;
use Illuminate\Support\Facades\File;

test('recruiter can create a java coding assessment from blueprint', function () {
    $recruiter = User::factory()->create([
        'role' => Role::Admin,
    ]);

    $this->actingAs($recruiter)
        ->post(route('recruiter.assessments.store'), [
            'assessment_type' => 'coding',
            'title' => 'Coding Test',
            'description' => 'Solve coding problems.',
            'duration_minutes' => 60,
            'passing_score' => 60,
            'randomize_questions' => false,
            'show_results_immediately' => true,
            'status' => 'draft',
            'question_blueprint' => [
                [
                    'topic' => 'arrays_hashmap',
                    'easy_count' => 1,
                    'medium_count' => 0,
                    'hard_count' => 0,
                ],
                [
                    'topic' => 'arrays',
                    'easy_count' => 0,
                    'medium_count' => 1,
                    'hard_count' => 0,
                ],
            ],
        ])
        ->assertRedirect();

    $assessment = Assessment::query()->firstOrFail();

    expect($assessment->questions()->count())->toBe(2);

    $codingQuestions = $assessment->questions()->where('question_type', 'coding')->get();
    expect($codingQuestions)->toHaveCount(2);

    foreach ($codingQuestions as $question) {
        expect($question->testCases()->where('is_sample', true)->count())->toBe(3);
        expect($question->metadata)->toBeArray();
        expect($question->metadata)->toHaveKey('language_variants');
    }
});

test('candidate can run samples and submit coding solution multiple times', function () {
    config(['queue.default' => 'sync']);

    $candidate = User::factory()->create([
        'role' => Role::Candidate,
        'email_verified_at' => now(),
    ]);

    CandidateProfile::factory()->create([
        'user_id' => $candidate->id,
        'profile_completed_at' => now(),
    ]);

    /** @var array{problems:array<int, array<string, mixed>>} $bank */
    $bank = json_decode((string) File::get(storage_path('app/datasets/java_coding_problem_bank.json')), true);
    /** @var array{problems:array<int, array<string, mixed>>} $pythonBank */
    $pythonBank = json_decode((string) File::get(storage_path('app/datasets/python_coding_problem_bank.json')), true);
    /** @var array{problems:array<int, array<string, mixed>>} $javascriptBank */
    $javascriptBank = json_decode((string) File::get(storage_path('app/datasets/javascript_coding_problem_bank.json')), true);

    /** @var array<string, mixed>|null $problem */
    $problem = collect($bank['problems'])->firstWhere('slug', 'two_sum');
    expect($problem)->toBeArray();

    /** @var array<string, mixed>|null $pythonProblem */
    $pythonProblem = collect($pythonBank['problems'])->firstWhere('slug', 'two_sum');
    expect($pythonProblem)->toBeArray();

    /** @var array<string, mixed>|null $javascriptProblem */
    $javascriptProblem = collect($javascriptBank['problems'])->firstWhere('slug', 'two_sum');
    expect($javascriptProblem)->toBeArray();

    $assessment = Assessment::query()->create([
        'created_by' => $candidate->id,
        'title' => 'Coding',
        'category' => 'arrays_hashmap',
        'difficulty' => 'easy',
        'duration_minutes' => 60,
        'total_questions' => 1,
        'passing_score' => 60,
        'randomize_questions' => false,
        'show_results_immediately' => true,
        'status' => 'active',
        'is_active' => true,
        'published_at' => now(),
    ]);

    $question = $assessment->questions()->create([
        'question_text' => (string) $problem['title'],
        'question_type' => 'coding',
        'category' => (string) $problem['topic_key'],
        'difficulty' => (string) $problem['difficulty'],
        'points' => 1,
        'source' => 'java_coding_problem_bank',
        'metadata' => [
            'slug' => (string) $problem['slug'],
            'topic_label' => (string) $problem['topic_label'],
            'statement_md' => (string) $problem['statement_md'],
            'default_language' => 'java',
            'language_variants' => [
                'java' => [
                    'starter_code' => (string) $problem['starter_code'],
                    'runner_source' => (string) $problem['runner_source'],
                ],
                'python' => [
                    'starter_code' => (string) $pythonProblem['starter_code'],
                    'runner_source' => (string) $pythonProblem['runner_source'],
                ],
                'javascript' => [
                    'starter_code' => (string) $javascriptProblem['starter_code'],
                    'runner_source' => (string) $javascriptProblem['runner_source'],
                ],
            ],
            'time_limit_ms' => (int) $problem['time_limit_ms'],
            'memory_limit_mb' => (int) $problem['memory_limit_mb'],
        ],
    ]);

    $sampleCases = $problem['sample_cases'];
    expect($sampleCases)->toBeArray()->and(count($sampleCases))->toBe(3);

    foreach ($sampleCases as $index => $case) {
        AssessmentQuestionTestCase::query()->create([
            'question_id' => $question->id,
            'is_sample' => true,
            'stdin' => (string) $case['stdin'],
            'expected_stdout' => (string) $case['expected_stdout'],
            'points' => 1,
            'display_order' => $index,
        ]);
    }

    AssessmentQuestionTestCase::query()->create([
        'question_id' => $question->id,
        'is_sample' => false,
        'stdin' => "4\n2 7 11 15\n9\n",
        'expected_stdout' => '0 1',
        'points' => 1,
        'display_order' => 100,
    ]);

    $attempt = AssessmentAttempt::query()->create([
        'assessment_id' => $assessment->id,
        'candidate_id' => $candidate->id,
        'attempt_number' => 1,
        'started_at' => now(),
        'max_score' => 1,
        'status' => 'in_progress',
    ]);

    app()->bind(JudgeClient::class, fn () => new class implements JudgeClient
    {
        public function run(
            string $language,
            string $sourceCode,
            string $runnerSource,
            array $testCases,
            int $timeLimitMs,
            int $memoryLimitMb,
        ): array {
            $sampleTotal = 0;
            $hiddenTotal = 0;

            foreach ($testCases as $case) {
                if ($case['is_sample']) {
                    $sampleTotal++;
                } else {
                    $hiddenTotal++;
                }
            }

            return [
                'verdict' => 'AC',
                'compile_output' => null,
                'case_results' => collect($testCases)->map(fn (array $case): array => [
                    'id' => (int) $case['id'],
                    'is_sample' => (bool) $case['is_sample'],
                    'verdict' => 'AC',
                    'passed' => true,
                    'runtime_ms' => 10,
                    'stdout_preview' => '',
                    'stderr_preview' => '',
                ])->all(),
                'sample_passed_count' => $sampleTotal,
                'sample_total_count' => $sampleTotal,
                'hidden_passed_count' => $hiddenTotal,
                'hidden_total_count' => $hiddenTotal,
            ];
        }
    });

    $this->actingAs($candidate)
        ->postJson(route('candidate.assessments.questions.run-samples', [
            'assessment' => $assessment->id,
            'question' => $question->id,
        ]), [
            'language' => 'java',
            'source_code' => (string) $problem['starter_code'],
        ])
        ->assertSuccessful()
        ->assertJsonPath('result.sample_total_count', 3);

    $this->actingAs($candidate)
        ->postJson(route('candidate.assessments.questions.run-samples', [
            'assessment' => $assessment->id,
            'question' => $question->id,
        ]), [
            'language' => 'python',
            'source_code' => (string) $pythonProblem['starter_code'],
        ])
        ->assertSuccessful()
        ->assertJsonPath('result.sample_total_count', 3);

    $firstSubmissionResponse = $this->actingAs($candidate)
        ->postJson(route('candidate.assessments.questions.submit-solution', [
            'assessment' => $assessment->id,
            'question' => $question->id,
        ]), [
            'language' => 'javascript',
            'source_code' => (string) $javascriptProblem['starter_code'],
        ])
        ->assertSuccessful()
        ->json();

    $submissionId = (int) ($firstSubmissionResponse['submission']['id'] ?? 0);
    expect($submissionId)->toBeGreaterThan(0);

    $this->actingAs($candidate)
        ->getJson(route('candidate.assessments.questions.submissions.show', [
            'assessment' => $assessment->id,
            'question' => $question->id,
            'submission' => $submissionId,
        ]))
        ->assertSuccessful()
        ->assertJsonPath('submission.status', 'completed')
        ->assertJsonPath('submission.hidden_total_count', 1);

    $response = AssessmentResponse::query()
        ->where('attempt_id', $attempt->id)
        ->where('question_id', $question->id)
        ->firstOrFail();

    expect($response->answer_language)->toBe('javascript');

    $secondSubmissionResponse = $this->actingAs($candidate)
        ->postJson(route('candidate.assessments.questions.submit-solution', [
            'assessment' => $assessment->id,
            'question' => $question->id,
        ]), [
            'language' => 'python',
            'source_code' => (string) $pythonProblem['starter_code'],
        ])
        ->assertSuccessful()
        ->json();

    expect((int) ($secondSubmissionResponse['submission']['submission_number'] ?? 0))->toBe(2);
});
