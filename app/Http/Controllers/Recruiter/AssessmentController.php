<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruiter\StoreAssessmentRequest;
use App\Models\Assessment;
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
        ]);
    }

    public function store(StoreAssessmentRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $validated = $request->validated();

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

        $assessment = DB::transaction(function () use ($validated, $user, $questions, $category): Assessment {
            $assessment = Assessment::query()->create([
                'created_by' => $user->id,
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

        return to_route('recruiter.assessments.show', $assessment)
            ->with('status', 'assessment-created');
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
