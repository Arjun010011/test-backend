<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveAssessmentAnswerRequest;
use App\Http\Requests\Candidate\StoreAssessmentProctoringEventRequest;
use App\Models\Assessment;
use App\Models\AssessmentAssignment;
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
            ->with([
                'assignments' => fn ($query) => $query->latest(),
            ])
            ->latest()
            ->get()
            ->filter(function (Assessment $assessment) use ($college): bool {
                if (! $assessment->assignments->contains(fn (AssessmentAssignment $assignment): bool => $assignment->is_active)) {
                    return true;
                }

                if ($college === null || trim($college) === '') {
                    return false;
                }

                return $assessment->assignments->contains(
                    fn (AssessmentAssignment $assignment): bool => $assignment->college_name === $college && $assignment->is_active,
                );
            })
            ->map(function (Assessment $assessment) use ($college, $user): array {
                $assignment = $this->findLatestAssignmentForCandidate($assessment, $college);

                $attemptCount = AssessmentAttempt::query()
                    ->where('assessment_id', $assessment->id)
                    ->where('candidate_id', $user->id)
                    ->count();

                $maxAttempts = $assignment?->max_attempts ?? 1;
                $isAssignmentAvailable = $assignment?->isAvailable() ?? true;
                $canAttempt = $isAssignmentAvailable && $attemptCount < $maxAttempts;
                $state = $this->candidateAssessmentState($assessment, $assignment, $canAttempt);

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
                    'assignment' => $assignment === null ? null : [
                        'id' => $assignment->id,
                        'college_name' => $assignment->college_name,
                        'starts_at' => $assignment->starts_at?->toDateTimeString(),
                        'ends_at' => $assignment->ends_at?->toDateTimeString(),
                        'max_attempts' => $assignment->max_attempts,
                    ],
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

    public function show(Request $request, Assessment $assessment): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $assignment = $this->findLatestAssignmentForCandidate($assessment, $user->candidateProfile?->university);

        abort_unless($this->canCandidateAccessAssessment($assessment, $assignment), 403);

        $attempts = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->latest()
            ->get();

        $maxAttempts = $assignment?->max_attempts ?? 1;
        $canAttempt = ($assignment?->isAvailable() ?? true) && $attempts->count() < $maxAttempts;
        $state = $this->candidateAssessmentState($assessment, $assignment, $canAttempt);

        return Inertia::render('candidate/assessments/show', [
            'assessment' => $assessment,
            'assignment' => $assignment,
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

        $assignment = $this->findLatestAssignmentForCandidate($assessment, $user->candidateProfile?->university);

        abort_unless($this->canCandidateAccessAssessment($assessment, $assignment), 403);

        $attemptCount = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('candidate_id', $user->id)
            ->count();

        $maxAttempts = $assignment?->max_attempts ?? 1;

        if ($attemptCount >= $maxAttempts) {
            return back()->with('status', 'assessment-attempt-limit-reached');
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
            'assignment_id' => $assignment?->id,
            'attempt_number' => $attemptCount + 1,
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

        return Inertia::render('candidate/assessments/result', [
            'assessment' => $assessment,
            'attempt' => $attempt,
            'passed' => $assessment->passing_score !== null
                ? (float) $attempt->percentage >= $assessment->passing_score
                : null,
        ]);
    }

    private function findLatestAssignmentForCandidate(Assessment $assessment, ?string $college): ?AssessmentAssignment
    {
        if ($college === null || trim($college) === '') {
            return null;
        }

        return AssessmentAssignment::query()
            ->where('assessment_id', $assessment->id)
            ->where('college_name', $college)
            ->latest()
            ->first();
    }

    private function canCandidateAccessAssessment(Assessment $assessment, ?AssessmentAssignment $assignment): bool
    {
        if ($assessment->status !== 'active') {
            return false;
        }

        $hasAssignmentRules = $assessment->assignments()->where('is_active', true)->exists();

        if (! $hasAssignmentRules) {
            return true;
        }

        return $assignment !== null && $assignment->isAvailable();
    }

    private function candidateAssessmentState(
        Assessment $assessment,
        ?AssessmentAssignment $assignment,
        bool $canAttempt,
    ): string {
        if ($assessment->status !== 'active') {
            return 'inactive';
        }

        if ($assignment !== null && ! $assignment->isAvailable()) {
            if ($assignment->starts_at !== null && now()->lt($assignment->starts_at)) {
                return 'upcoming';
            }

            return 'completed';
        }

        if (! $canAttempt) {
            return 'completed';
        }

        return 'active';
    }
}
