<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveAssessmentAnswerRequest;
use App\Http\Requests\Candidate\StoreAssessmentProctoringEventRequest;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentProctoringEvent;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentResponse;
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

        $questions = $assessment->questions()->with('options')->get();

        if ($assessment->randomize_questions) {
            $questions = $questions->shuffle()->values();
        }

        return Inertia::render('candidate/assessments/take', [
            'assessment' => $assessment,
            'attempt' => $attempt,
            'questions' => $questions,
            'existing_responses' => $attempt->responses()->pluck('selected_option_id', 'question_id'),
            'remaining_time' => $attempt->remainingTimeInSeconds(),
        ]);
    }

    public function saveAnswer(SaveAssessmentAnswerRequest $request, Assessment $assessment): JsonResponse
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

        $selectedOption = $question->options()->findOrFail($request->integer('selected_option_id'));

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
            ->filter(fn (AssessmentResponse $response): bool => (bool) $response->selectedOption?->is_correct)
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
