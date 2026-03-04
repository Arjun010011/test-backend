# CLAUDE CODE MASTER PROMPT: Assessment Module for Laravel Recruitment Platform

## 🎯 PROJECT CONTEXT

You are working on a **Laravel 12 + Inertia React recruitment platform** with role-based portals. The project uses:

- **Backend**: Laravel 12, PHP 8.4, Fortify auth, SQLite DB, Eloquent ORM
- **Frontend**: React 19, Inertia v2, TypeScript, Tailwind v4
- **Testing**: Pest

**Existing Roles** (App\Enums\Role):

- `candidate`, `company`, `admin`, `super_admin`

**Current Route Structure**:

- `/candidate/*` - Candidate portal
- `/recruiter/*` - Recruiter/admin portal (dashboard, candidates, collections, companies)
- `/company/*` - Company portal

**Key Models**: User, CandidateProfile, Resume, Company, CompanyApplication, RecruiterCollection, RecruiterComment, CandidateStatusHistory, CandidateWorkflowStatus, Skill

## 🚀 MISSION: BUILD COMPLETE ASSESSMENT/TEST MODULE

### HIGH-LEVEL REQUIREMENTS

1. **Recruiter Side**:
    - Create aptitude tests (CS engineering focus)
    - Auto-populate questions from free APIs/sources
    - Question categories: Programming, Algorithms, Data Structures, Aptitude, Reasoning
    - Assign tests to specific colleges
    - View comprehensive analytics dashboard

2. **Candidate Side**:
    - Take assigned tests (college-based access)
    - Timed test interface
    - View individual scores and performance

3. **Analytics**:
    - Top scorers leaderboard
    - Pass/fail rates
    - Question difficulty analysis
    - College-wise performance
    - Time-based insights

## 📋 IMPLEMENTATION CHECKLIST

### PHASE 1: DATABASE ARCHITECTURE

Create migrations for the following tables:

#### 1.1 `assessments` table

```php
Schema::create('assessments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
    $table->string('title');
    $table->text('description')->nullable();
    $table->string('category'); // CS, Programming, Aptitude, Mixed
    $table->enum('difficulty', ['easy', 'medium', 'hard', 'mixed']);
    $table->integer('duration_minutes'); // Test duration
    $table->integer('total_questions');
    $table->integer('passing_score')->nullable();
    $table->boolean('randomize_questions')->default(false);
    $table->boolean('show_results_immediately')->default(true);
    $table->boolean('is_active')->default(true);
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

#### 1.2 `assessment_questions` table

```php
Schema::create('assessment_questions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assessment_id')->constrained()->onDelete('cascade');
    $table->text('question_text');
    $table->string('question_type'); // multiple_choice, true_false, coding
    $table->string('category'); // Arrays, Linked Lists, Recursion, etc.
    $table->string('difficulty'); // easy, medium, hard
    $table->integer('points')->default(1);
    $table->text('explanation')->nullable();
    $table->string('source')->nullable(); // API source or 'generated'
    $table->json('metadata')->nullable(); // Store API response, tags, etc.
    $table->timestamps();
});
```

#### 1.3 `assessment_question_options` table

```php
Schema::create('assessment_question_options', function (Blueprint $table) {
    $table->id();
    $table->foreignId('question_id')->constrained('assessment_questions')->onDelete('cascade');
    $table->text('option_text');
    $table->boolean('is_correct')->default(false);
    $table->integer('display_order')->default(0);
    $table->timestamps();
});
```

#### 1.4 `assessment_assignments` table

```php
Schema::create('assessment_assignments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assessment_id')->constrained()->onDelete('cascade');
    $table->string('college_name'); // Can be normalized later to a colleges table
    $table->timestamp('starts_at')->nullable();
    $table->timestamp('ends_at')->nullable();
    $table->integer('max_attempts')->default(1);
    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->index(['assessment_id', 'college_name']);
});
```

#### 1.5 `assessment_attempts` table

```php
Schema::create('assessment_attempts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assessment_id')->constrained()->onDelete('cascade');
    $table->foreignId('candidate_id')->constrained('users')->onDelete('cascade');
    $table->foreignId('assignment_id')->nullable()->constrained('assessment_assignments')->onDelete('set null');
    $table->integer('attempt_number')->default(1);
    $table->timestamp('started_at');
    $table->timestamp('submitted_at')->nullable();
    $table->integer('time_taken_seconds')->nullable();
    $table->integer('score')->default(0);
    $table->integer('max_score');
    $table->decimal('percentage', 5, 2)->nullable();
    $table->enum('status', ['in_progress', 'submitted', 'abandoned', 'expired'])->default('in_progress');
    $table->json('answers_snapshot')->nullable(); // Store all responses
    $table->timestamps();

    $table->index(['candidate_id', 'assessment_id']);
    $table->index(['assessment_id', 'status']);
});
```

#### 1.6 `assessment_responses` table

```php
Schema::create('assessment_responses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('attempt_id')->constrained('assessment_attempts')->onDelete('cascade');
    $table->foreignId('question_id')->constrained('assessment_questions')->onDelete('cascade');
    $table->foreignId('selected_option_id')->nullable()->constrained('assessment_question_options')->onDelete('set null');
    $table->text('answer_text')->nullable(); // For text/coding questions
    $table->boolean('is_correct')->default(false);
    $table->integer('points_earned')->default(0);
    $table->integer('time_spent_seconds')->nullable();
    $table->timestamps();

    $table->unique(['attempt_id', 'question_id']);
});
```

**Action**: Create all migration files in `database/migrations/` following Laravel 12 naming convention.

---

### PHASE 2: ELOQUENT MODELS

Create the following models with relationships and business logic:

#### 2.1 `Assessment` Model

Location: `app/Models/Assessment.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assessment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'created_by',
        'title',
        'description',
        'category',
        'difficulty',
        'duration_minutes',
        'total_questions',
        'passing_score',
        'randomize_questions',
        'show_results_immediately',
        'is_active',
        'published_at',
    ];

    protected $casts = [
        'randomize_questions' => 'boolean',
        'show_results_immediately' => 'boolean',
        'is_active' => 'boolean',
        'published_at' => 'datetime',
    ];

    // Relationships
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(AssessmentQuestion::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AssessmentAssignment::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AssessmentAttempt::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }

    // Accessors & Methods
    public function getCompletionRateAttribute(): float
    {
        $total = $this->attempts()->count();
        if ($total === 0) return 0;

        $completed = $this->attempts()->where('status', 'submitted')->count();
        return round(($completed / $total) * 100, 2);
    }

    public function getAverageScoreAttribute(): float
    {
        return $this->attempts()
            ->where('status', 'submitted')
            ->avg('percentage') ?? 0;
    }
}
```

#### 2.2 `AssessmentQuestion` Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentQuestion extends Model
{
    protected $fillable = [
        'assessment_id',
        'question_text',
        'question_type',
        'category',
        'difficulty',
        'points',
        'explanation',
        'source',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(AssessmentQuestionOption::class, 'question_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AssessmentResponse::class, 'question_id');
    }

    public function correctOption()
    {
        return $this->hasOne(AssessmentQuestionOption::class, 'question_id')
            ->where('is_correct', true);
    }

    // Get accuracy rate for this question
    public function getAccuracyRateAttribute(): float
    {
        $total = $this->responses()->count();
        if ($total === 0) return 0;

        $correct = $this->responses()->where('is_correct', true)->count();
        return round(($correct / $total) * 100, 2);
    }
}
```

#### 2.3 `AssessmentQuestionOption` Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentQuestionOption extends Model
{
    protected $fillable = [
        'question_id',
        'option_text',
        'is_correct',
        'display_order',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(AssessmentQuestion::class, 'question_id');
    }
}
```

#### 2.4 `AssessmentAssignment` Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentAssignment extends Model
{
    protected $fillable = [
        'assessment_id',
        'college_name',
        'starts_at',
        'ends_at',
        'max_attempts',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AssessmentAttempt::class, 'assignment_id');
    }

    // Check if assignment is currently available
    public function isAvailable(): bool
    {
        if (!$this->is_active) return false;

        $now = now();

        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }

        if ($this->ends_at && $now->gt($this->ends_at)) {
            return false;
        }

        return true;
    }
}
```

#### 2.5 `AssessmentAttempt` Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentAttempt extends Model
{
    protected $fillable = [
        'assessment_id',
        'candidate_id',
        'assignment_id',
        'attempt_number',
        'started_at',
        'submitted_at',
        'time_taken_seconds',
        'score',
        'max_score',
        'percentage',
        'status',
        'answers_snapshot',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'answers_snapshot' => 'array',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(AssessmentAssignment::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AssessmentResponse::class, 'attempt_id');
    }

    // Check if attempt has expired
    public function hasExpired(): bool
    {
        if ($this->status !== 'in_progress') {
            return false;
        }

        $duration = $this->assessment->duration_minutes;
        $deadline = $this->started_at->addMinutes($duration);

        return now()->gt($deadline);
    }

    // Get remaining time in seconds
    public function getRemainingTimeAttribute(): int
    {
        if ($this->status !== 'in_progress') {
            return 0;
        }

        $duration = $this->assessment->duration_minutes;
        $deadline = $this->started_at->addMinutes($duration);
        $remaining = now()->diffInSeconds($deadline, false);

        return max(0, $remaining);
    }

    // Calculate and update score
    public function calculateScore(): void
    {
        $totalScore = 0;
        $maxScore = 0;

        foreach ($this->responses as $response) {
            $maxScore += $response->question->points;
            if ($response->is_correct) {
                $totalScore += $response->points_earned;
            }
        }

        $this->update([
            'score' => $totalScore,
            'max_score' => $maxScore,
            'percentage' => $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0,
        ]);
    }
}
```

#### 2.6 `AssessmentResponse` Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentResponse extends Model
{
    protected $fillable = [
        'attempt_id',
        'question_id',
        'selected_option_id',
        'answer_text',
        'is_correct',
        'points_earned',
        'time_spent_seconds',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(AssessmentAttempt::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(AssessmentQuestion::class, 'question_id');
    }

    public function selectedOption(): BelongsTo
    {
        return $this->belongsTo(AssessmentQuestionOption::class, 'selected_option_id');
    }
}
```

**Action**: Create all models in `app/Models/` with proper relationships, casts, and business logic methods.

---

### PHASE 3: QUESTION API SERVICE

Create a service to fetch questions from free APIs and generate using Claude AI.

#### 3.1 Question Provider Service

Location: `app/Services/QuestionProviderService.php`

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class QuestionProviderService
{
    /**
     * Generate CS aptitude questions using multiple sources
     */
    public function generateQuestions(string $category, string $difficulty, int $count = 10): array
    {
        $questions = [];

        // Try Open Trivia DB (free API)
        try {
            $triviaQuestions = $this->fetchFromOpenTriviaDB($category, $difficulty, $count);
            $questions = array_merge($questions, $triviaQuestions);
        } catch (\Exception $e) {
            \Log::warning('OpenTriviaDB fetch failed: ' . $e->getMessage());
        }

        // If we don't have enough questions, generate using predefined templates
        if (count($questions) < $count) {
            $remaining = $count - count($questions);
            $templateQuestions = $this->generateFromTemplates($category, $difficulty, $remaining);
            $questions = array_merge($questions, $templateQuestions);
        }

        return array_slice($questions, 0, $count);
    }

    /**
     * Fetch from Open Trivia Database API
     * Categories: 18 (Science: Computers), 9 (General Knowledge)
     */
    private function fetchFromOpenTriviaDB(string $category, string $difficulty, int $count): array
    {
        $categoryMap = [
            'programming' => 18, // Science: Computers
            'algorithms' => 18,
            'data_structures' => 18,
            'general' => 9,
        ];

        $categoryId = $categoryMap[$category] ?? 18;

        $response = Http::timeout(10)->get('https://opentdb.com/api.php', [
            'amount' => min($count, 50),
            'category' => $categoryId,
            'difficulty' => $difficulty,
            'type' => 'multiple',
        ]);

        if (!$response->successful()) {
            throw new \Exception('API request failed');
        }

        $data = $response->json();

        if ($data['response_code'] !== 0) {
            throw new \Exception('No questions available');
        }

        return collect($data['results'])->map(function ($item) use ($category) {
            $options = array_merge(
                [$item['correct_answer']],
                $item['incorrect_answers']
            );
            shuffle($options);

            return [
                'question_text' => html_entity_decode($item['question']),
                'question_type' => 'multiple_choice',
                'category' => $category,
                'difficulty' => $item['difficulty'],
                'points' => $this->getPointsByDifficulty($item['difficulty']),
                'source' => 'opentdb',
                'options' => collect($options)->map(fn($opt) => [
                    'option_text' => html_entity_decode($opt),
                    'is_correct' => $opt === $item['correct_answer'],
                ])->toArray(),
            ];
        })->toArray();
    }

    /**
     * Generate questions from predefined templates
     */
    private function generateFromTemplates(string $category, string $difficulty, int $count): array
    {
        $templates = $this->getQuestionTemplates();

        $categoryQuestions = $templates[$category] ?? $templates['programming'];
        $difficultyQuestions = collect($categoryQuestions)
            ->where('difficulty', $difficulty)
            ->shuffle()
            ->take($count)
            ->toArray();

        return $difficultyQuestions;
    }

    /**
     * Predefined question templates for CS aptitude
     */
    private function getQuestionTemplates(): array
    {
        return [
            'programming' => [
                [
                    'question_text' => 'What is the time complexity of binary search in a sorted array?',
                    'question_type' => 'multiple_choice',
                    'category' => 'programming',
                    'difficulty' => 'easy',
                    'points' => 1,
                    'source' => 'template',
                    'explanation' => 'Binary search divides the search space in half each iteration.',
                    'options' => [
                        ['option_text' => 'O(log n)', 'is_correct' => true],
                        ['option_text' => 'O(n)', 'is_correct' => false],
                        ['option_text' => 'O(n log n)', 'is_correct' => false],
                        ['option_text' => 'O(n²)', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => 'Which data structure uses LIFO (Last In First Out) principle?',
                    'question_type' => 'multiple_choice',
                    'category' => 'programming',
                    'difficulty' => 'easy',
                    'points' => 1,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'Stack', 'is_correct' => true],
                        ['option_text' => 'Queue', 'is_correct' => false],
                        ['option_text' => 'Array', 'is_correct' => false],
                        ['option_text' => 'Tree', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => 'What does SQL stand for?',
                    'question_type' => 'multiple_choice',
                    'category' => 'programming',
                    'difficulty' => 'easy',
                    'points' => 1,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'Structured Query Language', 'is_correct' => true],
                        ['option_text' => 'Simple Question Language', 'is_correct' => false],
                        ['option_text' => 'Standard Query Logic', 'is_correct' => false],
                        ['option_text' => 'System Query Language', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => 'Which sorting algorithm has the best average-case time complexity?',
                    'question_type' => 'multiple_choice',
                    'category' => 'programming',
                    'difficulty' => 'medium',
                    'points' => 2,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'Quick Sort (O(n log n))', 'is_correct' => true],
                        ['option_text' => 'Bubble Sort (O(n²))', 'is_correct' => false],
                        ['option_text' => 'Selection Sort (O(n²))', 'is_correct' => false],
                        ['option_text' => 'Insertion Sort (O(n²))', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => 'In Object-Oriented Programming, which concept allows hiding implementation details?',
                    'question_type' => 'multiple_choice',
                    'category' => 'programming',
                    'difficulty' => 'medium',
                    'points' => 2,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'Encapsulation', 'is_correct' => true],
                        ['option_text' => 'Inheritance', 'is_correct' => false],
                        ['option_text' => 'Polymorphism', 'is_correct' => false],
                        ['option_text' => 'Abstraction', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => 'What is the space complexity of merge sort?',
                    'question_type' => 'multiple_choice',
                    'category' => 'programming',
                    'difficulty' => 'hard',
                    'points' => 3,
                    'source' => 'template',
                    'explanation' => 'Merge sort requires O(n) additional space for merging.',
                    'options' => [
                        ['option_text' => 'O(n)', 'is_correct' => true],
                        ['option_text' => 'O(1)', 'is_correct' => false],
                        ['option_text' => 'O(log n)', 'is_correct' => false],
                        ['option_text' => 'O(n log n)', 'is_correct' => false],
                    ],
                ],
            ],
            'data_structures' => [
                [
                    'question_text' => 'Which data structure is best for implementing a priority queue?',
                    'question_type' => 'multiple_choice',
                    'category' => 'data_structures',
                    'difficulty' => 'medium',
                    'points' => 2,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'Heap', 'is_correct' => true],
                        ['option_text' => 'Array', 'is_correct' => false],
                        ['option_text' => 'Linked List', 'is_correct' => false],
                        ['option_text' => 'Stack', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => 'What is the worst-case time complexity for searching in a hash table?',
                    'question_type' => 'multiple_choice',
                    'category' => 'data_structures',
                    'difficulty' => 'medium',
                    'points' => 2,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'O(n)', 'is_correct' => true],
                        ['option_text' => 'O(1)', 'is_correct' => false],
                        ['option_text' => 'O(log n)', 'is_correct' => false],
                        ['option_text' => 'O(n²)', 'is_correct' => false],
                    ],
                ],
            ],
            'algorithms' => [
                [
                    'question_text' => 'Which algorithm is used to find the shortest path in a weighted graph?',
                    'question_type' => 'multiple_choice',
                    'category' => 'algorithms',
                    'difficulty' => 'medium',
                    'points' => 2,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'Dijkstra\'s Algorithm', 'is_correct' => true],
                        ['option_text' => 'Depth First Search', 'is_correct' => false],
                        ['option_text' => 'Breadth First Search', 'is_correct' => false],
                        ['option_text' => 'Binary Search', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => 'What is the purpose of dynamic programming?',
                    'question_type' => 'multiple_choice',
                    'category' => 'algorithms',
                    'difficulty' => 'hard',
                    'points' => 3,
                    'source' => 'template',
                    'options' => [
                        ['option_text' => 'Optimize recursive algorithms by storing subproblem results', 'is_correct' => true],
                        ['option_text' => 'Allocate memory dynamically', 'is_correct' => false],
                        ['option_text' => 'Create dynamic arrays', 'is_correct' => false],
                        ['option_text' => 'Modify program behavior at runtime', 'is_correct' => false],
                    ],
                ],
            ],
        ];
    }

    private function getPointsByDifficulty(string $difficulty): int
    {
        return match($difficulty) {
            'easy' => 1,
            'medium' => 2,
            'hard' => 3,
            default => 1,
        };
    }

    /**
     * Get available categories
     */
    public function getAvailableCategories(): array
    {
        return [
            'programming' => 'Programming Fundamentals',
            'data_structures' => 'Data Structures',
            'algorithms' => 'Algorithms',
            'aptitude' => 'Logical Aptitude',
            'general' => 'General CS Knowledge',
        ];
    }
}
```

**Action**: Create `app/Services/QuestionProviderService.php` with API integration and question templates.

---

### PHASE 4: CONTROLLERS

#### 4.1 Recruiter Assessment Controller

Location: `app/Http/Controllers/Recruiter/AssessmentController.php`

```php
<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentQuestionOption;
use App\Models\AssessmentAssignment;
use App\Services\QuestionProviderService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssessmentController extends Controller
{
    public function __construct(
        private QuestionProviderService $questionProvider
    ) {}

    /**
     * Display assessment list
     */
    public function index()
    {
        $assessments = Assessment::with(['creator', 'questions'])
            ->withCount(['attempts', 'assignments'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Recruiter/Assessments/Index', [
            'assessments' => $assessments,
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        $categories = $this->questionProvider->getAvailableCategories();

        return Inertia::render('Recruiter/Assessments/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store new assessment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'difficulty' => 'required|in:easy,medium,hard,mixed',
            'duration_minutes' => 'required|integer|min:5|max:180',
            'total_questions' => 'required|integer|min:5|max:100',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'randomize_questions' => 'boolean',
            'show_results_immediately' => 'boolean',
        ]);

        $assessment = Assessment::create([
            ...$validated,
            'created_by' => auth()->id(),
            'is_active' => false, // Draft until questions are added
        ]);

        // Generate questions automatically
        $questions = $this->questionProvider->generateQuestions(
            $validated['category'],
            $validated['difficulty'],
            $validated['total_questions']
        );

        foreach ($questions as $questionData) {
            $question = $assessment->questions()->create([
                'question_text' => $questionData['question_text'],
                'question_type' => $questionData['question_type'],
                'category' => $questionData['category'],
                'difficulty' => $questionData['difficulty'],
                'points' => $questionData['points'],
                'explanation' => $questionData['explanation'] ?? null,
                'source' => $questionData['source'],
            ]);

            foreach ($questionData['options'] as $index => $optionData) {
                $question->options()->create([
                    'option_text' => $optionData['option_text'],
                    'is_correct' => $optionData['is_correct'],
                    'display_order' => $index,
                ]);
            }
        }

        return redirect()
            ->route('recruiter.assessments.show', $assessment)
            ->with('success', 'Assessment created successfully with ' . count($questions) . ' questions');
    }

    /**
     * Display assessment details
     */
    public function show(Assessment $assessment)
    {
        $assessment->load([
            'questions.options',
            'assignments.attempts',
            'creator',
        ]);

        $analytics = [
            'total_attempts' => $assessment->attempts()->count(),
            'completed_attempts' => $assessment->attempts()->where('status', 'submitted')->count(),
            'average_score' => $assessment->attempts()->where('status', 'submitted')->avg('percentage'),
            'pass_rate' => $this->calculatePassRate($assessment),
        ];

        return Inertia::render('Recruiter/Assessments/Show', [
            'assessment' => $assessment,
            'analytics' => $analytics,
        ]);
    }

    /**
     * Show assignment creation form
     */
    public function createAssignment(Assessment $assessment)
    {
        // You could fetch colleges from a dedicated table if needed
        return Inertia::render('Recruiter/Assessments/CreateAssignment', [
            'assessment' => $assessment,
        ]);
    }

    /**
     * Store new assignment
     */
    public function storeAssignment(Request $request, Assessment $assessment)
    {
        $validated = $request->validate([
            'college_name' => 'required|string|max:255',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
            'max_attempts' => 'required|integer|min:1|max:5',
        ]);

        $assignment = $assessment->assignments()->create($validated);

        return redirect()
            ->route('recruiter.assessments.show', $assessment)
            ->with('success', 'Assessment assigned to ' . $validated['college_name']);
    }

    /**
     * Publish/unpublish assessment
     */
    public function toggleStatus(Assessment $assessment)
    {
        $assessment->update([
            'is_active' => !$assessment->is_active,
            'published_at' => $assessment->is_active ? null : now(),
        ]);

        $status = $assessment->is_active ? 'published' : 'unpublished';

        return back()->with('success', "Assessment {$status} successfully");
    }

    /**
     * Delete assessment
     */
    public function destroy(Assessment $assessment)
    {
        $assessment->delete();

        return redirect()
            ->route('recruiter.assessments.index')
            ->with('success', 'Assessment deleted successfully');
    }

    private function calculatePassRate(Assessment $assessment): float
    {
        if (!$assessment->passing_score) {
            return 0;
        }

        $completed = $assessment->attempts()->where('status', 'submitted')->count();
        if ($completed === 0) return 0;

        $passed = $assessment->attempts()
            ->where('status', 'submitted')
            ->where('percentage', '>=', $assessment->passing_score)
            ->count();

        return round(($passed / $completed) * 100, 2);
    }
}
```

#### 4.2 Assessment Analytics Controller

Location: `app/Http/Controllers/Recruiter/AssessmentAnalyticsController.php`

```php
<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssessmentAnalyticsController extends Controller
{
    /**
     * Show comprehensive analytics for an assessment
     */
    public function show(Assessment $assessment)
    {
        $assessment->load(['questions', 'assignments']);

        $analytics = [
            'overview' => $this->getOverviewStats($assessment),
            'top_scorers' => $this->getTopScorers($assessment),
            'score_distribution' => $this->getScoreDistribution($assessment),
            'question_difficulty' => $this->getQuestionDifficultyAnalysis($assessment),
            'college_performance' => $this->getCollegePerformance($assessment),
            'time_analysis' => $this->getTimeAnalysis($assessment),
        ];

        return Inertia::render('Recruiter/Assessments/Analytics', [
            'assessment' => $assessment,
            'analytics' => $analytics,
        ]);
    }

    private function getOverviewStats(Assessment $assessment): array
    {
        $attempts = $assessment->attempts()->where('status', 'submitted');

        return [
            'total_attempts' => $attempts->count(),
            'unique_candidates' => $attempts->distinct('candidate_id')->count(),
            'average_score' => round($attempts->avg('percentage'), 2),
            'highest_score' => $attempts->max('percentage'),
            'lowest_score' => $attempts->min('percentage'),
            'median_score' => $this->calculateMedian($attempts->pluck('percentage')),
            'pass_rate' => $this->calculatePassRate($assessment),
            'average_time' => round($attempts->avg('time_taken_seconds') / 60, 2), // in minutes
        ];
    }

    private function getTopScorers(Assessment $assessment, int $limit = 10): array
    {
        return AssessmentAttempt::with('candidate.candidateProfile')
            ->where('assessment_id', $assessment->id)
            ->where('status', 'submitted')
            ->orderByDesc('percentage')
            ->orderBy('time_taken_seconds')
            ->limit($limit)
            ->get()
            ->map(function ($attempt) {
                return [
                    'candidate_id' => $attempt->candidate_id,
                    'candidate_name' => $attempt->candidate->name,
                    'college' => $attempt->candidate->candidateProfile->education['college'] ?? 'N/A',
                    'score' => $attempt->score,
                    'max_score' => $attempt->max_score,
                    'percentage' => $attempt->percentage,
                    'time_taken' => gmdate('H:i:s', $attempt->time_taken_seconds),
                    'submitted_at' => $attempt->submitted_at,
                ];
            })
            ->toArray();
    }

    private function getScoreDistribution(Assessment $assessment): array
    {
        $ranges = [
            '0-20' => [0, 20],
            '21-40' => [21, 40],
            '41-60' => [41, 60],
            '61-80' => [61, 80],
            '81-100' => [81, 100],
        ];

        $distribution = [];

        foreach ($ranges as $label => $range) {
            $count = $assessment->attempts()
                ->where('status', 'submitted')
                ->whereBetween('percentage', $range)
                ->count();

            $distribution[] = [
                'range' => $label,
                'count' => $count,
            ];
        }

        return $distribution;
    }

    private function getQuestionDifficultyAnalysis(Assessment $assessment): array
    {
        return $assessment->questions()
            ->with(['responses' => function ($query) {
                $query->select('question_id', 'is_correct')
                    ->groupBy('question_id', 'is_correct');
            }])
            ->get()
            ->map(function ($question) {
                $totalResponses = $question->responses()->count();
                $correctResponses = $question->responses()->where('is_correct', true)->count();

                $accuracyRate = $totalResponses > 0
                    ? round(($correctResponses / $totalResponses) * 100, 2)
                    : 0;

                return [
                    'question_id' => $question->id,
                    'question_text' => substr($question->question_text, 0, 100) . '...',
                    'category' => $question->category,
                    'difficulty' => $question->difficulty,
                    'accuracy_rate' => $accuracyRate,
                    'total_responses' => $totalResponses,
                    'correct_responses' => $correctResponses,
                ];
            })
            ->sortBy('accuracy_rate')
            ->values()
            ->toArray();
    }

    private function getCollegePerformance(Assessment $assessment): array
    {
        return $assessment->attempts()
            ->with('candidate.candidateProfile')
            ->where('status', 'submitted')
            ->get()
            ->groupBy(function ($attempt) {
                return $attempt->candidate->candidateProfile->education['college'] ?? 'Unknown';
            })
            ->map(function ($collegeAttempts, $collegeName) {
                $scores = $collegeAttempts->pluck('percentage');

                return [
                    'college_name' => $collegeName,
                    'total_attempts' => $collegeAttempts->count(),
                    'average_score' => round($scores->avg(), 2),
                    'highest_score' => $scores->max(),
                    'lowest_score' => $scores->min(),
                ];
            })
            ->sortByDesc('average_score')
            ->values()
            ->toArray();
    }

    private function getTimeAnalysis(Assessment $assessment): array
    {
        $attempts = $assessment->attempts()
            ->where('status', 'submitted')
            ->orderBy('time_taken_seconds')
            ->get();

        if ($attempts->isEmpty()) {
            return [];
        }

        return [
            'average_time' => round($attempts->avg('time_taken_seconds') / 60, 2),
            'fastest_time' => round($attempts->min('time_taken_seconds') / 60, 2),
            'slowest_time' => round($attempts->max('time_taken_seconds') / 60, 2),
            'median_time' => round($this->calculateMedian($attempts->pluck('time_taken_seconds')) / 60, 2),
            'time_vs_score_correlation' => $this->calculateCorrelation(
                $attempts->pluck('time_taken_seconds'),
                $attempts->pluck('percentage')
            ),
        ];
    }

    private function calculatePassRate(Assessment $assessment): float
    {
        if (!$assessment->passing_score) {
            return 0;
        }

        $completed = $assessment->attempts()->where('status', 'submitted')->count();
        if ($completed === 0) return 0;

        $passed = $assessment->attempts()
            ->where('status', 'submitted')
            ->where('percentage', '>=', $assessment->passing_score)
            ->count();

        return round(($passed / $completed) * 100, 2);
    }

    private function calculateMedian($values)
    {
        $sorted = $values->sort()->values();
        $count = $sorted->count();

        if ($count === 0) return 0;

        $middle = floor($count / 2);

        if ($count % 2 === 0) {
            return ($sorted[$middle - 1] + $sorted[$middle]) / 2;
        }

        return $sorted[$middle];
    }

    private function calculateCorrelation($x, $y): float
    {
        if ($x->count() !== $y->count() || $x->count() === 0) {
            return 0;
        }

        $n = $x->count();
        $meanX = $x->avg();
        $meanY = $y->avg();

        $numerator = 0;
        $denomX = 0;
        $denomY = 0;

        for ($i = 0; $i < $n; $i++) {
            $diffX = $x[$i] - $meanX;
            $diffY = $y[$i] - $meanY;

            $numerator += $diffX * $diffY;
            $denomX += $diffX * $diffX;
            $denomY += $diffY * $diffY;
        }

        if ($denomX == 0 || $denomY == 0) {
            return 0;
        }

        return round($numerator / sqrt($denomX * $denomY), 3);
    }
}
```

#### 4.3 Candidate Assessment Controller

Location: `app/Http/Controllers/Candidate/AssessmentController.php`

```php
<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentAssignment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssessmentController extends Controller
{
    /**
     * List available assessments for candidate
     */
    public function index()
    {
        $candidate = auth()->user();
        $college = $candidate->candidateProfile->education['college'] ?? null;

        if (!$college) {
            return Inertia::render('Candidate/Assessments/Index', [
                'message' => 'Please update your college information in your profile to access assessments.',
                'assessments' => [],
            ]);
        }

        // Get assignments for candidate's college
        $assignments = AssessmentAssignment::with(['assessment.creator'])
            ->where('college_name', $college)
            ->where('is_active', true)
            ->whereHas('assessment', function ($query) {
                $query->where('is_active', true);
            })
            ->get()
            ->map(function ($assignment) use ($candidate) {
                $attempts = AssessmentAttempt::where('assessment_id', $assignment->assessment_id)
                    ->where('candidate_id', $candidate->id)
                    ->count();

                $canAttempt = $assignment->isAvailable() && $attempts < $assignment->max_attempts;

                return [
                    'id' => $assignment->id,
                    'assessment' => $assignment->assessment,
                    'starts_at' => $assignment->starts_at,
                    'ends_at' => $assignment->ends_at,
                    'max_attempts' => $assignment->max_attempts,
                    'attempts_taken' => $attempts,
                    'can_attempt' => $canAttempt,
                    'is_available' => $assignment->isAvailable(),
                ];
            });

        return Inertia::render('Candidate/Assessments/Index', [
            'assessments' => $assignments,
            'college' => $college,
        ]);
    }

    /**
     * Show assessment details before starting
     */
    public function show(Assessment $assessment)
    {
        $candidate = auth()->user();
        $college = $candidate->candidateProfile->education['college'] ?? null;

        // Check if candidate has access
        $assignment = AssessmentAssignment::where('assessment_id', $assessment->id)
            ->where('college_name', $college)
            ->where('is_active', true)
            ->first();

        if (!$assignment || !$assignment->isAvailable()) {
            abort(403, 'You do not have access to this assessment');
        }

        $attempts = AssessmentAttempt::where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidate->id)
            ->with('responses')
            ->get();

        $canAttempt = $attempts->count() < $assignment->max_attempts;

        return Inertia::render('Candidate/Assessments/Show', [
            'assessment' => $assessment,
            'assignment' => $assignment,
            'attempts' => $attempts,
            'can_attempt' => $canAttempt,
        ]);
    }

    /**
     * Start a new assessment attempt
     */
    public function start(Assessment $assessment)
    {
        $candidate = auth()->user();
        $college = $candidate->candidateProfile->education['college'] ?? null;

        $assignment = AssessmentAssignment::where('assessment_id', $assessment->id)
            ->where('college_name', $college)
            ->where('is_active', true)
            ->first();

        if (!$assignment || !$assignment->isAvailable()) {
            abort(403, 'You do not have access to this assessment');
        }

        $attemptCount = AssessmentAttempt::where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidate->id)
            ->count();

        if ($attemptCount >= $assignment->max_attempts) {
            return back()->with('error', 'You have exhausted all attempts for this assessment');
        }

        // Check for existing in-progress attempt
        $existingAttempt = AssessmentAttempt::where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidate->id)
            ->where('status', 'in_progress')
            ->first();

        if ($existingAttempt) {
            if ($existingAttempt->hasExpired()) {
                $existingAttempt->update(['status' => 'expired']);
            } else {
                return redirect()->route('candidate.assessments.take', $assessment);
            }
        }

        // Create new attempt
        $attempt = AssessmentAttempt::create([
            'assessment_id' => $assessment->id,
            'candidate_id' => $candidate->id,
            'assignment_id' => $assignment->id,
            'attempt_number' => $attemptCount + 1,
            'started_at' => now(),
            'max_score' => $assessment->questions()->sum('points'),
            'status' => 'in_progress',
        ]);

        return redirect()->route('candidate.assessments.take', $assessment);
    }

    /**
     * Take assessment (test interface)
     */
    public function take(Assessment $assessment)
    {
        $candidate = auth()->user();

        $attempt = AssessmentAttempt::where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidate->id)
            ->where('status', 'in_progress')
            ->first();

        if (!$attempt) {
            return redirect()->route('candidate.assessments.show', $assessment)
                ->with('error', 'No active attempt found. Please start a new attempt.');
        }

        if ($attempt->hasExpired()) {
            $attempt->update(['status' => 'expired']);
            return redirect()->route('candidate.assessments.show', $assessment)
                ->with('error', 'Your assessment time has expired.');
        }

        $questions = $assessment->questions()->with('options')->get();

        if ($assessment->randomize_questions) {
            $questions = $questions->shuffle();
        }

        $existingResponses = $attempt->responses()->pluck('selected_option_id', 'question_id');

        return Inertia::render('Candidate/Assessments/Take', [
            'assessment' => $assessment,
            'attempt' => $attempt,
            'questions' => $questions,
            'existing_responses' => $existingResponses,
            'remaining_time' => $attempt->remaining_time,
        ]);
    }

    /**
     * Save answer for a question
     */
    public function saveAnswer(Request $request, Assessment $assessment)
    {
        $validated = $request->validate([
            'question_id' => 'required|exists:assessment_questions,id',
            'selected_option_id' => 'required|exists:assessment_question_options,id',
        ]);

        $candidate = auth()->user();

        $attempt = AssessmentAttempt::where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidate->id)
            ->where('status', 'in_progress')
            ->firstOrFail();

        if ($attempt->hasExpired()) {
            $attempt->update(['status' => 'expired']);
            return response()->json(['error' => 'Assessment time expired'], 422);
        }

        $question = $assessment->questions()->findOrFail($validated['question_id']);
        $selectedOption = $question->options()->findOrFail($validated['selected_option_id']);

        $response = AssessmentResponse::updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'selected_option_id' => $selectedOption->id,
                'is_correct' => $selectedOption->is_correct,
                'points_earned' => $selectedOption->is_correct ? $question->points : 0,
            ]
        );

        return response()->json([
            'success' => true,
            'response' => $response,
        ]);
    }

    /**
     * Submit assessment
     */
    public function submit(Assessment $assessment)
    {
        $candidate = auth()->user();

        $attempt = AssessmentAttempt::where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidate->id)
            ->where('status', 'in_progress')
            ->firstOrFail();

        DB::transaction(function () use ($attempt) {
            $attempt->calculateScore();

            $timeTaken = now()->diffInSeconds($attempt->started_at);

            $attempt->update([
                'submitted_at' => now(),
                'time_taken_seconds' => $timeTaken,
                'status' => 'submitted',
                'answers_snapshot' => $attempt->responses()
                    ->with(['question', 'selectedOption'])
                    ->get()
                    ->toArray(),
            ]);
        });

        return redirect()->route('candidate.assessments.result', $assessment);
    }

    /**
     * View assessment result
     */
    public function result(Assessment $assessment)
    {
        $candidate = auth()->user();

        $attempt = AssessmentAttempt::where('assessment_id', $assessment->id)
            ->where('candidate_id', $candidate->id)
            ->where('status', 'submitted')
            ->latest()
            ->with(['responses.question.options', 'responses.selectedOption'])
            ->firstOrFail();

        $passed = $assessment->passing_score
            ? $attempt->percentage >= $assessment->passing_score
            : null;

        return Inertia::render('Candidate/Assessments/Result', [
            'assessment' => $assessment,
            'attempt' => $attempt,
            'passed' => $passed,
        ]);
    }
}
```

**Action**: Create all controller files with proper validation, authorization, and business logic.

---

### PHASE 5: ROUTES

Add to `routes/web.php`:

```php
// Recruiter Assessment Routes
Route::middleware(['auth', 'role:admin,super_admin'])->prefix('recruiter')->name('recruiter.')->group(function () {

    // Assessments CRUD
    Route::resource('assessments', \App\Http\Controllers\Recruiter\AssessmentController::class);

    // Assessment specific actions
    Route::post('assessments/{assessment}/toggle-status', [
        \App\Http\Controllers\Recruiter\AssessmentController::class, 'toggleStatus'
    ])->name('assessments.toggle-status');

    // Assignment management
    Route::get('assessments/{assessment}/assign', [
        \App\Http\Controllers\Recruiter\AssessmentController::class, 'createAssignment'
    ])->name('assessments.assign.create');

    Route::post('assessments/{assessment}/assign', [
        \App\Http\Controllers\Recruiter\AssessmentController::class, 'storeAssignment'
    ])->name('assessments.assign.store');

    // Analytics
    Route::get('assessments/{assessment}/analytics', [
        \App\Http\Controllers\Recruiter\AssessmentAnalyticsController::class, 'show'
    ])->name('assessments.analytics');
});

// Candidate Assessment Routes
Route::middleware(['auth', 'role:candidate'])->prefix('candidate')->name('candidate.')->group(function () {

    Route::get('assessments', [
        \App\Http\Controllers\Candidate\AssessmentController::class, 'index'
    ])->name('assessments.index');

    Route::get('assessments/{assessment}', [
        \App\Http\Controllers\Candidate\AssessmentController::class, 'show'
    ])->name('assessments.show');

    Route::post('assessments/{assessment}/start', [
        \App\Http\Controllers\Candidate\AssessmentController::class, 'start'
    ])->name('assessments.start');

    Route::get('assessments/{assessment}/take', [
        \App\Http\Controllers\Candidate\AssessmentController::class, 'take'
    ])->name('assessments.take');

    Route::post('assessments/{assessment}/answer', [
        \App\Http\Controllers\Candidate\AssessmentController::class, 'saveAnswer'
    ])->name('assessments.answer');

    Route::post('assessments/{assessment}/submit', [
        \App\Http\Controllers\Candidate\AssessmentController::class, 'submit'
    ])->name('assessments.submit');

    Route::get('assessments/{assessment}/result', [
        \App\Http\Controllers\Candidate\AssessmentController::class, 'result'
    ])->name('assessments.result');
});
```

**Action**: Add these routes to your `routes/web.php` file in the appropriate sections.

---

### PHASE 6: FRONTEND COMPONENTS (React + TypeScript + Inertia)

#### 6.1 Recruiter Assessment Index

Location: `resources/js/pages/Recruiter/Assessments/Index.tsx`

```typescript
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import RecruiterLayout from '@/layouts/RecruiterLayout';
import { Assessment } from '@/types';

interface Props {
    assessments: {
        data: Assessment[];
        links: any;
        meta: any;
    };
}

export default function Index({ assessments }: Props) {
    return (
        <RecruiterLayout>
            <Head title="Assessments" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
                    <Link
                        href={route('recruiter.assessments.create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Create Assessment
                    </Link>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Questions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Attempts
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assessments.data.map((assessment) => (
                                <tr key={assessment.id}>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={route('recruiter.assessments.show', assessment.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            {assessment.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {assessment.category}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {assessment.questions_count}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {assessment.attempts_count}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            assessment.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {assessment.is_active ? 'Active' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                        <Link
                                            href={route('recruiter.assessments.analytics', assessment.id)}
                                            className="text-purple-600 hover:text-purple-900"
                                        >
                                            Analytics
                                        </Link>
                                        <Link
                                            href={route('recruiter.assessments.assign.create', assessment.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Assign
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </RecruiterLayout>
    );
}
```

#### 6.2 Recruiter Assessment Create

Location: `resources/js/pages/Recruiter/Assessments/Create.tsx`

```typescript
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import RecruiterLayout from '@/layouts/RecruiterLayout';

interface Props {
    categories: Record<string, string>;
}

export default function Create({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        category: 'programming',
        difficulty: 'medium',
        duration_minutes: 60,
        total_questions: 20,
        passing_score: 70,
        randomize_questions: false,
        show_results_immediately: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('recruiter.assessments.store'));
    };

    return (
        <RecruiterLayout>
            <Head title="Create Assessment" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Assessment</h1>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            >
                                {Object.entries(categories).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                            <select
                                value={data.difficulty}
                                onChange={(e) => setData('difficulty', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="mixed">Mixed</option>
                            </select>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                            <input
                                type="number"
                                value={data.duration_minutes}
                                onChange={(e) => setData('duration_minutes', parseInt(e.target.value))}
                                min="5"
                                max="180"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>

                        {/* Total Questions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Questions</label>
                            <input
                                type="number"
                                value={data.total_questions}
                                onChange={(e) => setData('total_questions', parseInt(e.target.value))}
                                min="5"
                                max="100"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>

                        {/* Passing Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Passing Score (%)</label>
                            <input
                                type="number"
                                value={data.passing_score}
                                onChange={(e) => setData('passing_score', parseInt(e.target.value))}
                                min="0"
                                max="100"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={data.randomize_questions}
                                onChange={(e) => setData('randomize_questions', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">Randomize question order</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={data.show_results_immediately}
                                onChange={(e) => setData('show_results_immediately', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">Show results immediately after submission</span>
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Assessment'}
                        </button>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Questions will be automatically generated from our question bank based on the selected category and difficulty level.
                        </p>
                    </div>
                </form>
            </div>
        </RecruiterLayout>
    );
}
```

#### 6.3 Recruiter Analytics Dashboard

Location: `resources/js/pages/Recruiter/Assessments/Analytics.tsx`

```typescript
import React from 'react';
import { Head } from '@inertiajs/react';
import RecruiterLayout from '@/layouts/RecruiterLayout';
import { Assessment } from '@/types';

interface Analytics {
    overview: {
        total_attempts: number;
        unique_candidates: number;
        average_score: number;
        highest_score: number;
        lowest_score: number;
        median_score: number;
        pass_rate: number;
        average_time: number;
    };
    top_scorers: Array<{
        candidate_name: string;
        college: string;
        percentage: number;
        time_taken: string;
    }>;
    score_distribution: Array<{
        range: string;
        count: number;
    }>;
    question_difficulty: Array<{
        question_text: string;
        category: string;
        difficulty: string;
        accuracy_rate: number;
    }>;
    college_performance: Array<{
        college_name: string;
        total_attempts: number;
        average_score: number;
    }>;
}

interface Props {
    assessment: Assessment;
    analytics: Analytics;
}

export default function Analytics({ assessment, analytics }: Props) {
    return (
        <RecruiterLayout>
            <Head title={`Analytics - ${assessment.title}`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
                <p className="text-gray-600 mb-8">Assessment Analytics</p>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Total Attempts"
                        value={analytics.overview.total_attempts}
                        color="blue"
                    />
                    <StatCard
                        title="Average Score"
                        value={`${analytics.overview.average_score}%`}
                        color="green"
                    />
                    <StatCard
                        title="Pass Rate"
                        value={`${analytics.overview.pass_rate}%`}
                        color="purple"
                    />
                    <StatCard
                        title="Avg Time"
                        value={`${analytics.overview.average_time} min`}
                        color="orange"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Scorers */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Top Scorers</h2>
                        <div className="space-y-3">
                            {analytics.top_scorers.slice(0, 10).map((scorer, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div className="flex items-center space-x-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium">{scorer.candidate_name}</p>
                                            <p className="text-sm text-gray-500">{scorer.college}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-600">{scorer.percentage}%</p>
                                        <p className="text-xs text-gray-500">{scorer.time_taken}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Score Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Score Distribution</h2>
                        <div className="space-y-3">
                            {analytics.score_distribution.map((item) => (
                                <div key={item.range}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">{item.range}%</span>
                                        <span className="text-sm text-gray-600">{item.count} students</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${(item.count / analytics.overview.total_attempts) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* College Performance */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">College Performance</h2>
                        <div className="space-y-3">
                            {analytics.college_performance.map((college, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{college.college_name}</p>
                                            <p className="text-sm text-gray-500">{college.total_attempts} attempts</p>
                                        </div>
                                        <span className="text-lg font-bold text-blue-600">
                                            {college.average_score}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Question Difficulty Analysis */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Hardest Questions</h2>
                        <div className="space-y-3">
                            {analytics.question_difficulty.slice(0, 5).map((q, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded">
                                    <p className="text-sm mb-2">{q.question_text}</p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600">{q.category} · {q.difficulty}</span>
                                        <span className={`font-bold ${
                                            q.accuracy_rate < 30 ? 'text-red-600' :
                                            q.accuracy_rate < 60 ? 'text-orange-600' :
                                            'text-green-600'
                                        }`}>
                                            {q.accuracy_rate}% correct
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </RecruiterLayout>
    );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
    );
}
```

#### 6.4 Candidate Test Taking Interface

Location: `resources/js/pages/Candidate/Assessments/Take.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import CandidateLayout from '@/layouts/CandidateLayout';
import axios from 'axios';

interface Question {
    id: number;
    question_text: string;
    options: Array<{
        id: number;
        option_text: string;
    }>;
}

interface Props {
    assessment: any;
    attempt: any;
    questions: Question[];
    existing_responses: Record<number, number>;
    remaining_time: number;
}

export default function Take({ assessment, attempt, questions, existing_responses, remaining_time }: Props) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>(existing_responses);
    const [timeLeft, setTimeLeft] = useState(remaining_time);
    const [saving, setSaving] = useState(false);

    // Timer countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const currentQuestion = questions[currentQuestionIndex];

    const handleAnswerSelect = async (questionId: number, optionId: number) => {
        setAnswers({ ...answers, [questionId]: optionId });

        // Auto-save answer
        setSaving(true);
        try {
            await axios.post(route('candidate.assessments.answer', assessment.id), {
                question_id: questionId,
                selected_option_id: optionId,
            });
        } catch (error) {
            console.error('Failed to save answer:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = () => {
        if (confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
            router.post(route('candidate.assessments.submit', assessment.id));
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
        <CandidateLayout>
            <Head title={`Taking: ${assessment.title}`} />

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header with Timer */}
                <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{assessment.title}</h1>
                        <p className="text-sm text-gray-600">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                            {formatTime(timeLeft)}
                        </p>
                        <p className="text-sm text-gray-600">Time Remaining</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{answeredCount} / {questions.length} answered</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-lg shadow p-8 mb-6">
                    <div className="mb-6">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-4">
                            Question {currentQuestionIndex + 1}
                        </span>
                        <h2 className="text-xl font-semibold mb-6">{currentQuestion.question_text}</h2>
                    </div>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option) => (
                            <label
                                key={option.id}
                                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    answers[currentQuestion.id] === option.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${currentQuestion.id}`}
                                    checked={answers[currentQuestion.id] === option.id}
                                    onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                                    className="mt-1 text-blue-600"
                                />
                                <span className="ml-3 text-gray-900">{option.option_text}</span>
                            </label>
                        ))}
                    </div>

                    {saving && <p className="text-sm text-gray-500 mt-2">Saving...</p>}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                    >
                        Previous
                    </button>

                    <div className="flex space-x-2">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`w-10 h-10 rounded-full ${
                                    index === currentQuestionIndex
                                        ? 'bg-blue-600 text-white'
                                        : answers[questions[index].id]
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Submit Test
                        </button>
                    )}
                </div>
            </div>
        </CandidateLayout>
    );
}
```

**Action**: Create all React components following the existing pattern in your project.

---

### PHASE 7: TYPE DEFINITIONS

Add to `resources/js/types/index.d.ts`:

```typescript
export interface Assessment {
    id: number;
    created_by: number;
    title: string;
    description: string | null;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    duration_minutes: number;
    total_questions: number;
    passing_score: number | null;
    randomize_questions: boolean;
    show_results_immediately: boolean;
    is_active: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    questions_count?: number;
    attempts_count?: number;
}

export interface AssessmentQuestion {
    id: number;
    assessment_id: number;
    question_text: string;
    question_type: string;
    category: string;
    difficulty: string;
    points: number;
    explanation: string | null;
    source: string | null;
    options: AssessmentQuestionOption[];
}

export interface AssessmentQuestionOption {
    id: number;
    question_id: number;
    option_text: string;
    is_correct: boolean;
    display_order: number;
}

export interface AssessmentAttempt {
    id: number;
    assessment_id: number;
    candidate_id: number;
    attempt_number: number;
    started_at: string;
    submitted_at: string | null;
    time_taken_seconds: number | null;
    score: number;
    max_score: number;
    percentage: number | null;
    status: 'in_progress' | 'submitted' | 'abandoned' | 'expired';
}
```

**Action**: Add these type definitions to your TypeScript types file.

---

### PHASE 8: NAVIGATION UPDATES

Add assessment links to recruiter navigation:

```typescript
// In RecruiterLayout.tsx or navigation component
<NavLink href={route('recruiter.assessments.index')}>
    <Icon name="clipboard-list" />
    Assessments
</NavLink>
```

Add to candidate navigation:

```typescript
// In CandidateLayout.tsx
<NavLink href={route('candidate.assessments.index')}>
    <Icon name="file-text" />
    My Tests
</NavLink>
```

---

### PHASE 9: SEEDER (Optional - for testing)

Create: `database/seeders/AssessmentQuestionSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Assessment;
use App\Services\QuestionProviderService;

class AssessmentQuestionSeeder extends Seeder
{
    public function run()
    {
        $service = new QuestionProviderService();

        // Create sample assessment
        $assessment = Assessment::create([
            'created_by' => 1, // Adjust to your admin user ID
            'title' => 'CS Engineering Aptitude Test',
            'description' => 'Comprehensive test covering programming, data structures, and algorithms',
            'category' => 'programming',
            'difficulty' => 'medium',
            'duration_minutes' => 60,
            'total_questions' => 30,
            'passing_score' => 70,
            'randomize_questions' => true,
            'show_results_immediately' => true,
            'is_active' => true,
            'published_at' => now(),
        ]);

        // Generate questions
        $questions = $service->generateQuestions('programming', 'medium', 30);

        foreach ($questions as $questionData) {
            $question = $assessment->questions()->create([
                'question_text' => $questionData['question_text'],
                'question_type' => $questionData['question_type'],
                'category' => $questionData['category'],
                'difficulty' => $questionData['difficulty'],
                'points' => $questionData['points'],
                'explanation' => $questionData['explanation'] ?? null,
                'source' => $questionData['source'],
            ]);

            foreach ($questionData['options'] as $index => $optionData) {
                $question->options()->create([
                    'option_text' => $optionData['option_text'],
                    'is_correct' => $optionData['is_correct'],
                    'display_order' => $index,
                ]);
            }
        }

        $this->command->info('Assessment and questions seeded successfully!');
    }
}
```

---

## 🎯 EXECUTION WORKFLOW

### Step-by-Step Implementation

1. **Create all migrations** → Run `php artisan migrate`
2. **Create all models** with relationships
3. **Create QuestionProviderService** for API integration
4. **Create all controllers** (Recruiter + Candidate + Analytics)
5. **Add routes** to `routes/web.php`
6. **Create React components** for all pages
7. **Add navigation links** in layouts
8. **Test the flow**:
    - Recruiter creates assessment
    - Recruiter assigns to college
    - Candidate logs in and takes test
    - View analytics

### Testing Checklist

- [ ] Create assessment with auto-generated questions
- [ ] Assign assessment to college
- [ ] Candidate can view available tests
- [ ] Candidate can start and take test
- [ ] Timer works correctly
- [ ] Auto-save answers during test
- [ ] Submit and calculate score
- [ ] View individual results
- [ ] View analytics dashboard
- [ ] Top scorers display correctly
- [ ] College performance tracking works

---

## 🔧 ADDITIONAL ENHANCEMENTS (Optional)

1. **Question Categories Management**: Create CRUD for custom question categories
2. **Bulk Question Import**: CSV import for questions
3. **Email Notifications**: Notify candidates when tests are assigned
4. **Certificate Generation**: Auto-generate PDF certificates for passing candidates
5. **Proctoring Features**: Webcam monitoring, tab-switch detection
6. **Question Bank Management**: Recruiter can create custom questions
7. **Test Scheduling**: Schedule tests for specific date/time windows
8. **Mobile Responsiveness**: Ensure all components work on mobile devices

---

## 📚 RESOURCES

### Free Question APIs

- Open Trivia Database: https://opentdb.com/api_config.php
- Quiz API: https://quizapi.io/
- Trivia API: https://the-trivia-api.com/

### Laravel Resources

- Eloquent Relationships: https://laravel.com/docs/eloquent-relationships
- Validation: https://laravel.com/docs/validation
- Inertia.js: https://inertiajs.com/

---

## ✅ FINAL CHECKLIST

Before considering the implementation complete:

- [ ] All migrations run successfully
- [ ] All models created with relationships
- [ ] QuestionProviderService returns valid questions
- [ ] Recruiter can create and manage assessments
- [ ] Recruiter can assign tests to colleges
- [ ] Candidates can view and take tests
- [ ] Scoring works correctly
- [ ] Analytics dashboard displays all metrics
- [ ] Frontend is responsive and user-friendly
- [ ] Error handling is robust
- [ ] Code follows Laravel 12 best practices
- [ ] TypeScript types are defined
- [ ] Routes are protected with proper middleware

---

## 🚀 QUICK START COMMANDS

```bash
# Run migrations
php artisan migrate

# Seed sample data (optional)
php artisan db:seed --class=AssessmentQuestionSeeder

# Clear cache
php artisan optimize:clear

# Compile frontend
npm run dev

# Run tests
php artisan test --filter=Assessment
```

---

## END OF IMPLEMENTATION GUIDE

This comprehensive guide provides everything needed to build a complete assessment module. Follow each phase sequentially, test thoroughly, and enhance as needed. Good luck! 🎉
