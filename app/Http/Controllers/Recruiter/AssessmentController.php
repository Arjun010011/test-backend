<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruiter\StoreAssessmentRequest;
use App\Models\Assessment;
use App\Models\AssessmentQuestionTestCase;
use App\Services\JavaCodingProblemProviderService;
use App\Services\JavascriptCodingProblemProviderService;
use App\Services\MultiLanguageCodingProblemProviderService;
use App\Services\PythonCodingProblemProviderService;
use App\Services\QuestionProviderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class AssessmentController extends Controller
{
    public function __construct(
        public QuestionProviderService $questionProvider,
        public JavaCodingProblemProviderService $javaCodingProblemProvider,
        public PythonCodingProblemProviderService $pythonCodingProblemProvider,
        public JavascriptCodingProblemProviderService $javascriptCodingProblemProvider,
        public MultiLanguageCodingProblemProviderService $multiLanguageCodingProblemProvider,
    ) {}

    public function index(): Response
    {
        $assessments = Assessment::query()
            ->with('creator:id,name')
            ->withCount([
                'questions',
                'attempts',
                'attempts as completed_attempts_count' => fn ($query) => $query->where('status', 'submitted'),
            ])
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(function (Assessment $assessment): array {
                return [
                    'id' => $assessment->id,
                    'title' => $assessment->title,
                    'category' => $assessment->category,
                    'difficulty' => $assessment->difficulty,
                    'status' => $assessment->status,
                    'is_active' => $assessment->is_active,
                    'questions_count' => $assessment->questions_count,
                    'attempts_count' => $assessment->attempts_count,
                    'completed_attempts_count' => $assessment->completed_attempts_count,
                    'created_at' => $assessment->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('recruiter/assessments/index', [
            'assessments' => $assessments,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('recruiter/assessments/create', [
            'topics' => $this->questionProvider->getAvailableTopics(),
            'coding_topics' => [
                'coding' => $this->multiLanguageCodingProblemProvider->getAvailableTopics(),
            ],
        ]);
    }

    public function store(StoreAssessmentRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $validated = $request->validated();

        $assessmentType = (string) ($validated['assessment_type'] ?? 'aptitude');

        $assessment = match ($assessmentType) {
            'coding' => $this->storeMultiLanguageCodingAssessment($validated, $user->id),
            'coding_java' => $this->storeJavaCodingAssessment($validated, $user->id),
            'coding_python' => $this->storePythonCodingAssessment($validated, $user->id),
            'coding_javascript' => $this->storeJavascriptCodingAssessment($validated, $user->id),
            default => $this->storeAptitudeAssessment($validated, $user->id),
        };

        return to_route('recruiter.assessments.show', $assessment)
            ->with('status', 'assessment-created');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function storeAptitudeAssessment(array $validated, int $userId): Assessment
    {
        try {
            $questions = $this->questionProvider->generateQuestionsFromBlueprint(
                $validated['question_blueprint'],
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'question_blueprint' => $exception->getMessage(),
            ]);
        }

        $availableTopics = $this->questionProvider->getAvailableTopics();
        $category = collect($validated['question_blueprint'])
            ->map(fn (array $selection): string => $availableTopics[$selection['topic']] ?? $selection['topic'])
            ->implode(', ');

        return DB::transaction(function () use ($validated, $userId, $questions, $category): Assessment {
            $assessment = Assessment::query()->create([
                'created_by' => $userId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'category' => $category === '' ? 'custom' : $category,
                'difficulty' => 'mixed',
                'duration_minutes' => $validated['duration_minutes'],
                'total_questions' => $validated['total_questions'],
                'passing_score' => $validated['passing_score'] ?? null,
                'randomize_questions' => $validated['randomize_questions'] ?? false,
                'show_results_immediately' => $validated['show_results_immediately'] ?? true,
                'status' => $validated['status'],
                'is_active' => $validated['status'] === 'active',
                'published_at' => $validated['status'] === 'active' ? now() : null,
            ]);

            foreach ($questions as $questionData) {
                $question = $assessment->questions()->create([
                    'question_text' => $questionData['question_text'],
                    'question_type' => $questionData['question_type'],
                    'category' => $questionData['category'],
                    'difficulty' => $questionData['difficulty'],
                    'points' => $questionData['points'],
                    'explanation' => $questionData['explanation'] ?? null,
                    'source' => $questionData['source'] ?? null,
                    'metadata' => $questionData['metadata'] ?? null,
                ]);

                foreach ($questionData['options'] as $index => $optionData) {
                    $question->options()->create([
                        'option_text' => $optionData['option_text'],
                        'is_correct' => (bool) $optionData['is_correct'],
                        'display_order' => $index,
                    ]);
                }
            }

            return $assessment;
        });
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function storeJavaCodingAssessment(array $validated, int $userId): Assessment
    {
        try {
            $problems = $this->javaCodingProblemProvider->generateProblemsFromBlueprint(
                $validated['question_blueprint'],
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'question_blueprint' => $exception->getMessage(),
            ]);
        }

        $availableTopics = $this->javaCodingProblemProvider->getAvailableTopics();

        return $this->storeCodingAssessmentFromProblems(
            $validated,
            $userId,
            $problems,
            $availableTopics,
            language: 'java',
            source: 'java_coding_problem_bank',
        );
    }

    private function pointsByDifficulty(string $difficulty): int
    {
        return match ($difficulty) {
            'hard' => 3,
            'medium' => 2,
            default => 1,
        };
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function storeMultiLanguageCodingAssessment(array $validated, int $userId): Assessment
    {
        try {
            $problems = $this->multiLanguageCodingProblemProvider->generateProblemsFromBlueprint(
                $validated['question_blueprint'],
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'question_blueprint' => $exception->getMessage(),
            ]);
        }

        $availableTopics = $this->multiLanguageCodingProblemProvider->getAvailableTopics();
        $category = collect($validated['question_blueprint'])
            ->map(fn (array $selection): string => $availableTopics[$selection['topic']] ?? $selection['topic'])
            ->implode(', ');

        return DB::transaction(function () use ($validated, $userId, $problems, $category): Assessment {
            $assessment = Assessment::query()->create([
                'created_by' => $userId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'category' => $category === '' ? 'custom' : $category,
                'difficulty' => 'mixed',
                'duration_minutes' => $validated['duration_minutes'],
                'total_questions' => $validated['total_questions'],
                'passing_score' => $validated['passing_score'] ?? null,
                'randomize_questions' => $validated['randomize_questions'] ?? false,
                'show_results_immediately' => $validated['show_results_immediately'] ?? true,
                'status' => $validated['status'],
                'is_active' => $validated['status'] === 'active',
                'published_at' => $validated['status'] === 'active' ? now() : null,
            ]);

            foreach ($problems as $problem) {
                if (! is_array($problem)) {
                    continue;
                }

                $sampleCases = $problem['sample_cases'] ?? [];

                if (! is_array($sampleCases) || count($sampleCases) !== 3) {
                    throw ValidationException::withMessages([
                        'question_blueprint' => 'Every coding problem must include exactly 3 sample test cases.',
                    ]);
                }

                $variants = $problem['language_variants'] ?? null;

                if (! is_array($variants) || $variants === []) {
                    throw ValidationException::withMessages([
                        'question_blueprint' => 'Coding problem language variants are missing.',
                    ]);
                }

                $question = $assessment->questions()->create([
                    'question_text' => (string) ($problem['title'] ?? 'Coding Question'),
                    'question_type' => 'coding',
                    'category' => (string) ($problem['topic_key'] ?? 'general'),
                    'difficulty' => (string) ($problem['difficulty'] ?? 'easy'),
                    'points' => $this->pointsByDifficulty((string) ($problem['difficulty'] ?? 'easy')),
                    'explanation' => null,
                    'source' => 'coding_problem_bank',
                    'metadata' => [
                        'slug' => (string) ($problem['slug'] ?? ''),
                        'topic_label' => (string) ($problem['topic_label'] ?? ''),
                        'statement_md' => (string) ($problem['statement_md'] ?? ''),
                        'time_limit_ms' => (int) ($problem['time_limit_ms'] ?? 2000),
                        'memory_limit_mb' => (int) ($problem['memory_limit_mb'] ?? 256),
                        'default_language' => array_key_exists('java', $variants) ? 'java' : array_key_first($variants),
                        'language_variants' => $variants,
                    ],
                ]);

                foreach ($sampleCases as $index => $case) {
                    AssessmentQuestionTestCase::query()->create([
                        'question_id' => $question->id,
                        'is_sample' => true,
                        'stdin' => (string) ($case['stdin'] ?? ''),
                        'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
                        'points' => (int) ($case['points'] ?? 1),
                        'display_order' => $index,
                    ]);
                }

                $hiddenCases = $problem['hidden_cases'] ?? [];

                if (is_array($hiddenCases)) {
                    foreach ($hiddenCases as $hiddenIndex => $case) {
                        AssessmentQuestionTestCase::query()->create([
                            'question_id' => $question->id,
                            'is_sample' => false,
                            'stdin' => (string) ($case['stdin'] ?? ''),
                            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
                            'points' => (int) ($case['points'] ?? 1),
                            'display_order' => 100 + $hiddenIndex,
                        ]);
                    }
                }
            }

            return $assessment;
        });
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function storePythonCodingAssessment(array $validated, int $userId): Assessment
    {
        try {
            $problems = $this->pythonCodingProblemProvider->generateProblemsFromBlueprint(
                $validated['question_blueprint'],
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'question_blueprint' => $exception->getMessage(),
            ]);
        }

        $availableTopics = $this->pythonCodingProblemProvider->getAvailableTopics();

        return $this->storeCodingAssessmentFromProblems(
            $validated,
            $userId,
            $problems,
            $availableTopics,
            language: 'python',
            source: 'python_coding_problem_bank',
        );
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function storeJavascriptCodingAssessment(array $validated, int $userId): Assessment
    {
        try {
            $problems = $this->javascriptCodingProblemProvider->generateProblemsFromBlueprint(
                $validated['question_blueprint'],
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'question_blueprint' => $exception->getMessage(),
            ]);
        }

        $availableTopics = $this->javascriptCodingProblemProvider->getAvailableTopics();

        return $this->storeCodingAssessmentFromProblems(
            $validated,
            $userId,
            $problems,
            $availableTopics,
            language: 'javascript',
            source: 'javascript_coding_problem_bank',
        );
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  array<int, array<string, mixed>>  $problems
     * @param  array<string, string>  $availableTopics
     */
    private function storeCodingAssessmentFromProblems(
        array $validated,
        int $userId,
        array $problems,
        array $availableTopics,
        string $language,
        string $source,
    ): Assessment {
        $category = collect($validated['question_blueprint'])
            ->map(fn (array $selection): string => $availableTopics[$selection['topic']] ?? $selection['topic'])
            ->implode(', ');

        return DB::transaction(function () use ($validated, $userId, $problems, $category, $language, $source): Assessment {
            $assessment = Assessment::query()->create([
                'created_by' => $userId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'category' => $category === '' ? 'custom' : $category,
                'difficulty' => 'mixed',
                'duration_minutes' => $validated['duration_minutes'],
                'total_questions' => $validated['total_questions'],
                'passing_score' => $validated['passing_score'] ?? null,
                'randomize_questions' => $validated['randomize_questions'] ?? false,
                'show_results_immediately' => $validated['show_results_immediately'] ?? true,
                'status' => $validated['status'],
                'is_active' => $validated['status'] === 'active',
                'published_at' => $validated['status'] === 'active' ? now() : null,
            ]);

            foreach ($problems as $problem) {
                if (! is_array($problem)) {
                    continue;
                }

                $sampleCases = $problem['sample_cases'] ?? [];

                if (! is_array($sampleCases) || count($sampleCases) !== 3) {
                    throw ValidationException::withMessages([
                        'question_blueprint' => 'Every coding problem must include exactly 3 sample test cases.',
                    ]);
                }

                $question = $assessment->questions()->create([
                    'question_text' => (string) ($problem['title'] ?? 'Coding Question'),
                    'question_type' => 'coding',
                    'category' => (string) ($problem['topic_key'] ?? 'general'),
                    'difficulty' => (string) ($problem['difficulty'] ?? 'easy'),
                    'points' => $this->pointsByDifficulty((string) ($problem['difficulty'] ?? 'easy')),
                    'explanation' => null,
                    'source' => $source,
                    'metadata' => [
                        'language' => $language,
                        'slug' => (string) ($problem['slug'] ?? ''),
                        'topic_label' => (string) ($problem['topic_label'] ?? ''),
                        'statement_md' => (string) ($problem['statement_md'] ?? ''),
                        'starter_code' => (string) ($problem['starter_code'] ?? ''),
                        'runner_source' => (string) ($problem['runner_source'] ?? ''),
                        'time_limit_ms' => (int) ($problem['time_limit_ms'] ?? 2000),
                        'memory_limit_mb' => (int) ($problem['memory_limit_mb'] ?? 256),
                    ],
                ]);

                foreach ($sampleCases as $index => $case) {
                    AssessmentQuestionTestCase::query()->create([
                        'question_id' => $question->id,
                        'is_sample' => true,
                        'stdin' => (string) ($case['stdin'] ?? ''),
                        'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
                        'points' => (int) ($case['points'] ?? 1),
                        'display_order' => $index,
                    ]);
                }

                $hiddenCases = $problem['hidden_cases'] ?? [];

                if (is_array($hiddenCases)) {
                    foreach ($hiddenCases as $hiddenIndex => $case) {
                        AssessmentQuestionTestCase::query()->create([
                            'question_id' => $question->id,
                            'is_sample' => false,
                            'stdin' => (string) ($case['stdin'] ?? ''),
                            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
                            'points' => (int) ($case['points'] ?? 1),
                            'display_order' => 100 + $hiddenIndex,
                        ]);
                    }
                }
            }

            return $assessment;
        });
    }

    public function show(Assessment $assessment): Response
    {
        $assessment->load([
            'creator:id,name',
            'questions.options',
        ]);

        return Inertia::render('recruiter/assessments/show', [
            'assessment' => $assessment,
            'analytics' => [
                'total_attempts' => $assessment->attempts()->count(),
                'completed_attempts' => $assessment->attempts()->where('status', 'submitted')->count(),
                'average_score' => $assessment->averageScore(),
                'pass_rate' => $this->calculatePassRate($assessment),
            ],
        ]);
    }

    public function toggleStatus(Assessment $assessment): RedirectResponse
    {
        $validated = request()->validate([
            'status' => ['required', 'in:draft,active,private'],
        ]);

        $assessment->forceFill([
            'status' => $validated['status'],
            'is_active' => $validated['status'] === 'active',
            'published_at' => $validated['status'] === 'active' ? now() : null,
        ])->save();

        return back()->with('status', 'assessment-status-updated');
    }

    public function destroy(Assessment $assessment): RedirectResponse
    {
        $assessment->delete();

        return to_route('recruiter.assessments.index')->with('status', 'assessment-deleted');
    }

    private function calculatePassRate(Assessment $assessment): float
    {
        if ($assessment->passing_score === null) {
            return 0;
        }

        $completedCount = $assessment->attempts()->where('status', 'submitted')->count();

        if ($completedCount === 0) {
            return 0;
        }

        $passedCount = $assessment->attempts()
            ->where('status', 'submitted')
            ->where('percentage', '>=', $assessment->passing_score)
            ->count();

        return round(($passedCount / $completedCount) * 100, 2);
    }
}
