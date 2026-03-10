<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\RunCodingSamplesRequest;
use App\Http\Requests\Candidate\SaveAssessmentResponseRequest;
use App\Http\Requests\Candidate\StoreAssessmentProctoringEventRequest;
use App\Http\Requests\Candidate\SubmitCodingSolutionRequest;
use App\Jobs\GradeAssessmentCodeSubmission;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentCodeSubmission;
use App\Models\AssessmentProctoringEvent;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentResponse;
use App\Services\Judge\JudgeClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $college = $user->candidateProfile?->university;

        $assessments = Assessment::query()
            ->active()
            ->latest()
            ->get()
            ->map(function (Assessment $assessment) use ($user): array {
                $attemptCount = AssessmentAttempt::query()
                    ->where('assessment_id', $assessment->id)
                    ->where('candidate_id', $user->id)
                    ->count();

                $personDetectionAutoCloseCount = $this->personDetectionAutoCloseCount($assessment, $user->id);
                $maxAttemptNumber = $this->maxAttemptNumber($assessment, $user->id);
                $maxAttempts = $personDetectionAutoCloseCount > 0 || $maxAttemptNumber >= 2 ? 2 : 1;
                $canAttempt = $this->canStartAssessmentAttempt(
                    $attemptCount,
                    $personDetectionAutoCloseCount,
                    $maxAttemptNumber,
                );
                $state = $this->candidateAssessmentState($assessment, $canAttempt);

                return [
                    'assessment' => [
                        'id' => $assessment->id,
                        'title' => $assessment->title,
                        'description' => $assessment->description,
                        'category' => $assessment->category,
                        'difficulty' => $assessment->difficulty,
                        'duration_minutes' => $assessment->duration_minutes,
                        'total_questions' => $assessment->total_questions,
                        'passing_score' => $assessment->passing_score,
                    ],
                    'assignment' => null,
                    'attempts_taken' => $attemptCount,
                    'max_attempts' => $maxAttempts,
                    'can_attempt' => $canAttempt,
                    'state' => $state,
                ];
            })
            ->values();

        return Inertia::render('candidate/assessments/index', [
            'assessments' => $assessments,
            'college' => $college,
            'message' => $college === null || trim($college) === ''
                ? 'Add your college in profile to access college-specific tests. Global tests are still available.'
                : null,
        ]);
    }

    public function show(Request $request, Assessment $assessment): Response|RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        if ($assessment->status !== 'active') {
            return to_route('candidate.assessments.index')
                ->with('status', 'assessment-no-longer-available');
        }

        $attempts = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->latest()
            ->get();

        $personDetectionAutoCloseCount = $this->personDetectionAutoCloseCount($assessment, $user->id);
        $maxAttemptNumber = $this->maxAttemptNumber($assessment, $user->id);
        $maxAttempts = $personDetectionAutoCloseCount > 0 || $maxAttemptNumber >= 2 ? 2 : 1;
        $canAttempt = $this->canStartAssessmentAttempt(
            $attempts->count(),
            $personDetectionAutoCloseCount,
            $maxAttemptNumber,
        );
        $state = $this->candidateAssessmentState($assessment, $canAttempt);

        return Inertia::render('candidate/assessments/show', [
            'assessment' => $assessment,
            'assignment' => null,
            'attempts' => $attempts,
            'can_attempt' => $canAttempt,
            'max_attempts' => $maxAttempts,
            'state' => $state,
        ]);
    }

    public function start(Request $request, Assessment $assessment): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        if ($assessment->status !== 'active') {
            return to_route('candidate.assessments.index')
                ->with('status', 'assessment-no-longer-available');
        }

        $attemptCount = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->count();

        $personDetectionAutoCloseCount = $this->personDetectionAutoCloseCount($assessment, $user->id);
        $maxAttemptNumber = $this->maxAttemptNumber($assessment, $user->id);

        if (! $this->canStartAssessmentAttempt($attemptCount, $personDetectionAutoCloseCount, $maxAttemptNumber)) {
            return back()->with('status', 'assessment-attempt-limit-reached');
        }

        $nextAttemptNumber = $maxAttemptNumber + 1;

        if ($attemptCount === 1 && $personDetectionAutoCloseCount === 1 && $maxAttemptNumber === 1) {
            AssessmentAttempt::query()
                ->where('assessment_id', $assessment->id)
                ->where('candidate_id', $user->id)
                ->delete();

            $attemptCount = 0;
        }

        $existingAttempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();

        if ($existingAttempt !== null) {
            if ($existingAttempt->hasExpired()) {
                $existingAttempt->forceFill(['status' => 'expired'])->save();
            } else {
                return to_route('candidate.assessments.take', $assessment);
            }
        }

        AssessmentAttempt::query()->create([
            'assessment_id' => $assessment->id,
            'candidate_id' => $user->id,
            'assignment_id' => null,
            'attempt_number' => $nextAttemptNumber,
            'started_at' => now(),
            'max_score' => (int) $assessment->questions()->sum('points'),
            'status' => 'in_progress',
        ]);

        return to_route('candidate.assessments.take', $assessment);
    }

    public function take(Request $request, Assessment $assessment): Response|RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();

        if ($attempt === null) {
            return to_route('candidate.assessments.show', $assessment)
                ->with('status', 'assessment-attempt-missing');
        }

        if ($attempt->hasExpired()) {
            $attempt->forceFill(['status' => 'expired'])->save();

            return to_route('candidate.assessments.show', $assessment)
                ->with('status', 'assessment-attempt-expired');
        }

        $questions = $assessment->questions()
            ->with([
                'options',
                'testCases' => fn ($query) => $query->where('is_sample', true),
            ])
            ->get()
            ->map(function (AssessmentQuestion $question): array {
                $base = [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'category' => $question->category,
                    'difficulty' => $question->difficulty,
                    'points' => $question->points,
                ];

                if ($question->question_type === 'coding') {
                    $metadata = is_array($question->metadata) ? $question->metadata : [];
                    $variants = is_array($metadata['language_variants'] ?? null) ? (array) ($metadata['language_variants'] ?? []) : [];
                    $legacyLanguage = (string) ($metadata['language'] ?? 'java');

                    if ($variants === [] && ((string) ($metadata['starter_code'] ?? '')) !== '') {
                        $variants = [
                            $legacyLanguage => [
                                'starter_code' => (string) ($metadata['starter_code'] ?? ''),
                            ],
                        ];
                    }

                    $starterByLanguage = collect($variants)
                        ->filter(fn ($value): bool => is_array($value) && array_key_exists('starter_code', $value))
                        ->mapWithKeys(fn (array $value, string $language): array => [
                            $language => (string) ($value['starter_code'] ?? ''),
                        ])
                        ->all();

                    return [
                        ...$base,
                        'metadata' => [
                            'slug' => (string) ($metadata['slug'] ?? ''),
                            'topic_label' => (string) ($metadata['topic_label'] ?? ''),
                            'statement_md' => (string) ($metadata['statement_md'] ?? ''),
                            'time_limit_ms' => (int) ($metadata['time_limit_ms'] ?? 2000),
                            'memory_limit_mb' => (int) ($metadata['memory_limit_mb'] ?? 256),
                            'default_language' => (string) ($metadata['default_language'] ?? array_key_first($starterByLanguage) ?? $legacyLanguage),
                            'languages' => array_values(array_keys($starterByLanguage)),
                            'starter_code_by_language' => $starterByLanguage,
                            'sample_cases' => $question->testCases
                                ->values()
                                ->map(fn ($case): array => [
                                    'id' => $case->id,
                                    'stdin' => $case->stdin,
                                    'expected_stdout' => $case->expected_stdout,
                                ])
                                ->all(),
                        ],
                        'options' => [],
                    ];
                }

                return [
                    ...$base,
                    'options' => $question->options
                        ->values()
                        ->map(fn ($option): array => [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                        ])
                        ->all(),
                ];
            });

        if ($assessment->randomize_questions) {
            $questions = $questions->shuffle()->values();
        }

        $existingResponses = $attempt->responses()->get(['question_id', 'selected_option_id', 'answer_text']);
        $existingMcqResponses = $existingResponses
            ->whereNotNull('selected_option_id')
            ->pluck('selected_option_id', 'question_id');
        $existingCodeDrafts = $existingResponses
            ->whereNotNull('answer_text')
            ->mapWithKeys(fn (AssessmentResponse $response): array => [
                (string) $response->question_id => [
                    'language' => $response->answer_language,
                    'code' => $response->answer_text,
                ],
            ]);

        $codingSubmissions = AssessmentCodeSubmission::query()
            ->where('attempt_id', $attempt->id)
            ->latest('id')
            ->get()
            ->groupBy('question_id')
            ->map(function ($submissions): array {
                /** @var AssessmentCodeSubmission $latest */
                $latest = $submissions->first();

                $best = $submissions
                    ->filter(fn (AssessmentCodeSubmission $submission): bool => $submission->status === 'completed')
                    ->sortByDesc(fn (AssessmentCodeSubmission $submission): int => $submission->passedHidden() ? 1 : 0)
                    ->first();

                return [
                    'latest' => $latest === null ? null : [
                        'id' => $latest->id,
                        'status' => $latest->status,
                        'verdict' => $latest->verdict,
                        'hidden_passed_count' => $latest->hidden_passed_count,
                        'hidden_total_count' => $latest->hidden_total_count,
                        'sample_passed_count' => $latest->sample_passed_count,
                        'sample_total_count' => $latest->sample_total_count,
                        'created_at' => $latest->created_at?->toDateTimeString(),
                    ],
                    'best_passed_hidden' => $best instanceof AssessmentCodeSubmission ? $best->passedHidden() : false,
                    'total_submissions' => $submissions->count(),
                ];
            })
            ->all();

        return Inertia::render('candidate/assessments/take', [
            'assessment' => $assessment,
            'attempt' => $attempt,
            'questions' => $questions,
            'existing_mcq_responses' => $existingMcqResponses,
            'existing_code_drafts' => $existingCodeDrafts,
            'coding_submissions' => $codingSubmissions,
            'remaining_time' => $attempt->remainingTimeInSeconds(),
        ]);
    }

    public function saveAnswer(SaveAssessmentResponseRequest $request, Assessment $assessment): JsonResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->firstOrFail();

        if ($attempt->hasExpired()) {
            $attempt->forceFill(['status' => 'expired'])->save();

            return response()->json(['message' => 'Assessment time expired.'], 422);
        }

        $question = AssessmentQuestion::query()
            ->where('assessment_id', $assessment->id)
            ->findOrFail($request->integer('question_id'));

        if ($question->question_type === 'coding') {
            $answerText = $request->string('answer_text')->toString();
            $language = strtolower(trim($request->string('language')->toString()));

            $response = AssessmentResponse::query()->updateOrCreate(
                [
                    'attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                ],
                [
                    'selected_option_id' => null,
                    'answer_text' => $answerText,
                    'answer_language' => $language === '' ? null : $language,
                    'is_correct' => false,
                    'points_earned' => 0,
                ],
            );

            return response()->json([
                'success' => true,
                'response' => $response,
            ]);
        }

        $selectedOptionId = $request->integer('selected_option_id');

        if ($selectedOptionId === 0) {
            return response()->json(['message' => 'Please choose an option before saving.'], 422);
        }

        $selectedOption = $question->options()->findOrFail($selectedOptionId);

        $response = AssessmentResponse::query()->updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'selected_option_id' => $selectedOption->id,
                'is_correct' => $selectedOption->is_correct,
                'points_earned' => $selectedOption->is_correct ? $question->points : 0,
            ],
        );

        return response()->json([
            'success' => true,
            'response' => $response,
        ]);
    }

    public function runCodingSamples(
        RunCodingSamplesRequest $request,
        Assessment $assessment,
        AssessmentQuestion $question,
        JudgeClient $judge,
    ): JsonResponse {
        $user = $request->user();

        abort_unless($user !== null, 403);

        abort_unless($question->assessment_id === $assessment->id, 404);
        abort_unless($question->question_type === 'coding', 422);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->firstOrFail();

        if ($attempt->hasExpired()) {
            $attempt->forceFill(['status' => 'expired'])->save();

            return response()->json(['message' => 'Assessment time expired.'], 422);
        }

        $testCases = $question->testCases()
            ->where('is_sample', true)
            ->orderBy('display_order')
            ->get();

        if ($testCases->count() !== 3) {
            return response()->json(['message' => 'Sample test cases are not configured correctly.'], 422);
        }

        $metadata = is_array($question->metadata) ? $question->metadata : [];
        $requestedLanguage = strtolower(trim($request->string('language')->toString()));

        $variants = is_array($metadata['language_variants'] ?? null) ? (array) ($metadata['language_variants'] ?? []) : [];
        $legacyLanguage = strtolower((string) ($metadata['language'] ?? 'java'));
        $legacyRunner = (string) ($metadata['runner_source'] ?? '');

        if ($variants === [] && $legacyRunner !== '') {
            $variants = [
                $legacyLanguage => [
                    'runner_source' => $legacyRunner,
                ],
            ];
        }

        if (! array_key_exists($requestedLanguage, $variants)) {
            return response()->json(['message' => 'Selected language is not available for this problem.'], 422);
        }

        $runnerSource = (string) (($variants[$requestedLanguage]['runner_source'] ?? '') ?: '');

        $result = $judge->run(
            language: $requestedLanguage,
            sourceCode: $request->string('source_code')->toString(),
            runnerSource: $runnerSource,
            testCases: $testCases->map(fn ($case): array => [
                'id' => $case->id,
                'stdin' => $case->stdin,
                'expected_stdout' => $case->expected_stdout,
                'is_sample' => true,
            ])->all(),
            timeLimitMs: (int) ($metadata['time_limit_ms'] ?? 2000),
            memoryLimitMb: (int) ($metadata['memory_limit_mb'] ?? 256),
        );

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    public function submitCodingSolution(
        SubmitCodingSolutionRequest $request,
        Assessment $assessment,
        AssessmentQuestion $question,
    ): JsonResponse {
        $user = $request->user();

        abort_unless($user !== null, 403);

        abort_unless($question->assessment_id === $assessment->id, 404);
        abort_unless($question->question_type === 'coding', 422);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->firstOrFail();

        if ($attempt->hasExpired()) {
            $attempt->forceFill(['status' => 'expired'])->save();

            return response()->json(['message' => 'Assessment time expired.'], 422);
        }

        $sourceCode = $request->string('source_code')->toString();
        $requestedLanguage = strtolower(trim($request->string('language')->toString()));

        AssessmentResponse::query()->updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'selected_option_id' => null,
                'answer_text' => $sourceCode,
                'answer_language' => $requestedLanguage === '' ? null : $requestedLanguage,
            ],
        );

        $metadata = is_array($question->metadata) ? $question->metadata : [];
        $variants = is_array($metadata['language_variants'] ?? null) ? (array) ($metadata['language_variants'] ?? []) : [];
        $legacyLanguage = strtolower((string) ($metadata['language'] ?? 'java'));
        $legacyRunner = (string) ($metadata['runner_source'] ?? '');

        if ($variants === [] && $legacyRunner !== '') {
            $variants = [
                $legacyLanguage => [
                    'runner_source' => $legacyRunner,
                ],
            ];
        }

        if (! array_key_exists($requestedLanguage, $variants)) {
            return response()->json(['message' => 'Selected language is not available for this problem.'], 422);
        }

        $submissionNumber = (int) (AssessmentCodeSubmission::query()
            ->where('attempt_id', $attempt->id)
            ->where('question_id', $question->id)
            ->max('submission_number') ?? 0) + 1;

        $submission = AssessmentCodeSubmission::query()->create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'submission_number' => $submissionNumber,
            'language' => $requestedLanguage,
            'source_code' => $sourceCode,
            'status' => 'queued',
        ]);

        GradeAssessmentCodeSubmission::dispatch($submission->id);

        return response()->json([
            'success' => true,
            'submission' => [
                'id' => $submission->id,
                'status' => $submission->status,
                'submission_number' => $submission->submission_number,
            ],
        ]);
    }

    public function codingSubmissionStatus(
        Request $request,
        Assessment $assessment,
        AssessmentQuestion $question,
        AssessmentCodeSubmission $submission,
    ): JsonResponse {
        $user = $request->user();

        abort_unless($user !== null, 403);

        abort_unless($question->assessment_id === $assessment->id, 404);
        abort_unless($question->id === $submission->question_id, 404);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->find($submission->attempt_id);

        abort_unless($attempt !== null && $attempt->id === $submission->attempt_id, 404);

        return response()->json([
            'success' => true,
            'submission' => [
                'id' => $submission->id,
                'status' => $submission->status,
                'verdict' => $submission->verdict,
                'compile_output' => $submission->compile_output,
                'sample_passed_count' => $submission->sample_passed_count,
                'sample_total_count' => $submission->sample_total_count,
                'hidden_passed_count' => $submission->hidden_passed_count,
                'hidden_total_count' => $submission->hidden_total_count,
                'created_at' => $submission->created_at?->toDateTimeString(),
            ],
        ]);
    }

    public function storeProctoringEvent(
        StoreAssessmentProctoringEventRequest $request,
        Assessment $assessment,
    ): JsonResponse {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->firstOrFail();

        AssessmentProctoringEvent::query()->create([
            'assessment_id' => $assessment->id,
            'attempt_id' => $attempt->id,
            'candidate_id' => $user->id,
            'event_type' => $request->string('event_type')->toString(),
            'severity' => $request->string('severity')->toString(),
            'metadata' => $request->input('metadata', []),
            'occurred_at' => $request->date('occurred_at') ?? now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function submit(Request $request, Assessment $assessment): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->firstOrFail();

        DB::transaction(function () use ($attempt): void {
            $attempt->calculateScore();

            $timeTakenSeconds = max(0, now()->diffInSeconds($attempt->started_at, false));

            $attempt->forceFill([
                'submitted_at' => now(),
                'time_taken_seconds' => $timeTakenSeconds,
                'status' => 'submitted',
                'answers_snapshot' => $attempt->responses()
                    ->with(['question', 'selectedOption'])
                    ->get()
                    ->toArray(),
            ])->save();
        });

        return to_route('candidate.assessments.result', $assessment);
    }

    public function result(Request $request, Assessment $assessment): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->where('status', 'submitted')
            ->latest('id')
            ->with(['responses.question.options', 'responses.selectedOption'])
            ->firstOrFail();

        $totalQuestions = (int) $assessment->questions()->count();
        $correctAnswers = $attempt->responses
            ->filter(fn (AssessmentResponse $response): bool => (bool) $response->is_correct)
            ->count();

        return Inertia::render('candidate/assessments/result', [
            'assessment' => $assessment,
            'attempt' => $attempt,
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
            'passed' => $assessment->passing_score !== null
                ? (float) $attempt->percentage >= $assessment->passing_score
                : null,
        ]);
    }

    private function candidateAssessmentState(
        Assessment $assessment,
        bool $canAttempt,
    ): string {
        if ($assessment->status !== 'active') {
            return 'inactive';
        }

        if (! $canAttempt) {
            return 'completed';
        }

        return 'active';
    }

    private function personDetectionAutoCloseCount(Assessment $assessment, int $candidateId): int
    {
        return AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidateId)
            ->whereHas('proctoringEvents', function ($query): void {
                $query->where('event_type', 'no_person_detected_limit_exceeded');
            })
            ->count();
    }

    private function canStartAssessmentAttempt(
        int $attemptCount,
        int $personDetectionAutoCloseCount,
        int $maxAttemptNumber,
    ): bool {
        if ($maxAttemptNumber >= 2) {
            return false;
        }

        if ($attemptCount === 0) {
            return true;
        }

        return $attemptCount === 1 && $personDetectionAutoCloseCount === 1 && $maxAttemptNumber === 1;
    }

    private function maxAttemptNumber(Assessment $assessment, int $candidateId): int
    {
        return (int) (AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidateId)
            ->max('attempt_number') ?? 0);
    }
}
