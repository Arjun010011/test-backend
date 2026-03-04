<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentProctoringEvent;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentAnalyticsController extends Controller
{
    public function show(Assessment $assessment): Response
    {
        $assessment->load(['questions', 'assignments']);

        return Inertia::render('recruiter/assessments/analytics', [
            'assessment' => $assessment,
            'analytics' => [
                'overview' => $this->overviewStats($assessment),
                'top_scorers' => $this->topScorers($assessment),
                'score_distribution' => $this->scoreDistribution($assessment),
                'question_difficulty' => $this->questionDifficulty($assessment),
                'college_performance' => $this->collegePerformance($assessment),
                'time_analysis' => $this->timeAnalysis($assessment),
                'proctoring' => $this->proctoringSummary($assessment),
            ],
        ]);
    }

    /**
     * @return array<string, float|int>
     */
    private function overviewStats(Assessment $assessment): array
    {
        $attempts = $assessment->attempts()->where('status', 'submitted');
        $percentages = $attempts->pluck('percentage');
        $averageTimeSeconds = (float) ($attempts->avg('time_taken_seconds') ?? 0);

        return [
            'total_attempts' => $attempts->count(),
            'unique_candidates' => $attempts->distinct('candidate_id')->count('candidate_id'),
            'average_score' => round((float) ($attempts->avg('percentage') ?? 0), 2),
            'highest_score' => (float) ($attempts->max('percentage') ?? 0),
            'lowest_score' => (float) ($attempts->min('percentage') ?? 0),
            'median_score' => $this->median($percentages),
            'pass_rate' => $this->passRate($assessment),
            'average_time' => round($averageTimeSeconds / 60, 2),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function topScorers(Assessment $assessment, int $limit = 10): array
    {
        $attempts = AssessmentAttempt::query()
            ->with('candidate.candidateProfile:id,user_id,university')
            ->where('assessment_id', $assessment->id)
            ->where('status', 'submitted')
            ->orderByDesc('percentage')
            ->orderBy('time_taken_seconds')
            ->limit($limit)
            ->get();

        $eventsByAttempt = AssessmentProctoringEvent::query()
            ->whereIn('attempt_id', $attempts->pluck('id'))
            ->get()
            ->groupBy('attempt_id');

        return $attempts
            ->map(fn (AssessmentAttempt $attempt): array => [
                'candidate_id' => $attempt->candidate_id,
                'candidate_name' => $attempt->candidate->name,
                'college' => $attempt->candidate->candidateProfile->university ?? 'Unknown',
                'score' => $attempt->score,
                'max_score' => $attempt->max_score,
                'percentage' => (float) $attempt->percentage,
                'time_taken' => gmdate('H:i:s', (int) ($attempt->time_taken_seconds ?? 0)),
                'risk_score' => $this->riskScoreOutOfTen($eventsByAttempt->get($attempt->id, collect())),
                'submitted_at' => $attempt->submitted_at,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{range:string,count:int}>
     */
    private function scoreDistribution(Assessment $assessment): array
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
            $distribution[] = [
                'range' => $label,
                'count' => $assessment->attempts()
                    ->where('status', 'submitted')
                    ->whereBetween('percentage', $range)
                    ->count(),
            ];
        }

        return $distribution;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function questionDifficulty(Assessment $assessment): array
    {
        return $assessment->questions()
            ->withCount('responses')
            ->withCount([
                'responses as correct_responses_count' => fn ($query) => $query->where('is_correct', true),
            ])
            ->get()
            ->map(function ($question): array {
                $total = (int) $question->responses_count;
                $correct = (int) $question->correct_responses_count;
                $accuracy = $total > 0 ? round(($correct / $total) * 100, 2) : 0;

                return [
                    'question_id' => $question->id,
                    'question_text' => mb_substr($question->question_text, 0, 100),
                    'category' => $question->category,
                    'difficulty' => $question->difficulty,
                    'accuracy_rate' => $accuracy,
                    'total_responses' => $total,
                    'correct_responses' => $correct,
                ];
            })
            ->sortBy('accuracy_rate')
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function collegePerformance(Assessment $assessment): array
    {
        return $assessment->attempts()
            ->with('candidate.candidateProfile:id,user_id,university')
            ->where('status', 'submitted')
            ->get()
            ->groupBy(fn (AssessmentAttempt $attempt): string => $attempt->candidate->candidateProfile->university ?? 'Unknown')
            ->map(function (Collection $attempts, string $college): array {
                $scores = $attempts->pluck('percentage')->filter()->map(fn ($score): float => (float) $score);

                return [
                    'college_name' => $college,
                    'total_attempts' => $attempts->count(),
                    'average_score' => round((float) ($scores->avg() ?? 0), 2),
                    'highest_score' => (float) ($scores->max() ?? 0),
                    'lowest_score' => (float) ($scores->min() ?? 0),
                ];
            })
            ->sortByDesc('average_score')
            ->values()
            ->all();
    }

    /**
     * @return array<string, float>
     */
    private function timeAnalysis(Assessment $assessment): array
    {
        $attempts = $assessment->attempts()
            ->where('status', 'submitted')
            ->whereNotNull('time_taken_seconds')
            ->orderBy('time_taken_seconds')
            ->get();

        if ($attempts->isEmpty()) {
            return [
                'average_time' => 0,
                'fastest_time' => 0,
                'slowest_time' => 0,
                'median_time' => 0,
                'time_vs_score_correlation' => 0,
            ];
        }

        $timeValues = $attempts->pluck('time_taken_seconds')->map(fn ($value): float => (float) $value);
        $scoreValues = $attempts->pluck('percentage')->map(fn ($value): float => (float) $value);

        return [
            'average_time' => round($timeValues->avg() / 60, 2),
            'fastest_time' => round($timeValues->min() / 60, 2),
            'slowest_time' => round($timeValues->max() / 60, 2),
            'median_time' => round($this->median($timeValues) / 60, 2),
            'time_vs_score_correlation' => $this->correlation($timeValues, $scoreValues),
        ];
    }

    private function passRate(Assessment $assessment): float
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

    private function median(Collection $values): float
    {
        $sorted = $values->sort()->values();
        $count = $sorted->count();

        if ($count === 0) {
            return 0;
        }

        $middleIndex = intdiv($count, 2);

        if ($count % 2 === 0) {
            return round(((float) $sorted[$middleIndex - 1] + (float) $sorted[$middleIndex]) / 2, 2);
        }

        return round((float) $sorted[$middleIndex], 2);
    }

    private function correlation(Collection $x, Collection $y): float
    {
        $count = $x->count();

        if ($count === 0 || $count !== $y->count()) {
            return 0;
        }

        $meanX = (float) $x->avg();
        $meanY = (float) $y->avg();

        $numerator = 0;
        $denominatorX = 0;
        $denominatorY = 0;

        for ($index = 0; $index < $count; $index++) {
            $deltaX = (float) $x[$index] - $meanX;
            $deltaY = (float) $y[$index] - $meanY;

            $numerator += $deltaX * $deltaY;
            $denominatorX += $deltaX ** 2;
            $denominatorY += $deltaY ** 2;
        }

        if ($denominatorX == 0 || $denominatorY == 0) {
            return 0;
        }

        return round($numerator / sqrt($denominatorX * $denominatorY), 3);
    }

    private function riskScoreOutOfTen(Collection $events): float
    {
        if ($events->isEmpty()) {
            return 0.0;
        }

        $weightedRisk = $events->sum(function (AssessmentProctoringEvent $event): int {
            return match ($event->severity) {
                'high' => 3,
                'medium' => 2,
                default => 1,
            };
        });

        return round(min(10, $weightedRisk / 1.5), 1);
    }

    /**
     * @return array<string, mixed>
     */
    private function proctoringSummary(Assessment $assessment): array
    {
        $events = AssessmentProctoringEvent::query()
            ->with('candidate:id,name')
            ->where('assessment_id', $assessment->id)
            ->latest('occurred_at')
            ->get();

        $highSeverityEvents = $events->where('severity', 'high')->count();
        $mediumSeverityEvents = $events->where('severity', 'medium')->count();
        $lowSeverityEvents = $events->where('severity', 'low')->count();

        return [
            'total_events' => $events->count(),
            'high_severity_events' => $highSeverityEvents,
            'medium_severity_events' => $mediumSeverityEvents,
            'low_severity_events' => $lowSeverityEvents,
            'event_types' => $events
                ->groupBy('event_type')
                ->map(fn (Collection $group, string $eventType): array => [
                    'event_type' => $eventType,
                    'count' => $group->count(),
                ])
                ->sortByDesc('count')
                ->values()
                ->all(),
            'flagged_candidates' => $events
                ->groupBy('candidate_id')
                ->map(function (Collection $group): array {
                    $candidateName = (string) ($group->first()?->candidate?->name ?? 'Unknown');
                    $riskScore = $group->sum(function (AssessmentProctoringEvent $event): int {
                        return match ($event->severity) {
                            'high' => 5,
                            'medium' => 2,
                            default => 1,
                        };
                    });

                    return [
                        'candidate_id' => (int) ($group->first()?->candidate_id ?? 0),
                        'candidate_name' => $candidateName,
                        'risk_score' => $riskScore,
                        'high_events' => $group->where('severity', 'high')->count(),
                        'medium_events' => $group->where('severity', 'medium')->count(),
                        'low_events' => $group->where('severity', 'low')->count(),
                    ];
                })
                ->sortByDesc('risk_score')
                ->take(15)
                ->values()
                ->all(),
            'recent_events' => $events
                ->take(30)
                ->map(fn (AssessmentProctoringEvent $event): array => [
                    'candidate_name' => $event->candidate?->name ?? 'Unknown',
                    'event_type' => $event->event_type,
                    'severity' => $event->severity,
                    'occurred_at' => $event->occurred_at?->toDateTimeString(),
                    'metadata' => $event->metadata ?? [],
                ])
                ->values()
                ->all(),
        ];
    }
}
