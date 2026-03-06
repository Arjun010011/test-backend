<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentAttempt extends Model
{
    use HasFactory;

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

    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'time_taken_seconds' => 'integer',
            'score' => 'integer',
            'max_score' => 'integer',
            'percentage' => 'decimal:2',
            'answers_snapshot' => 'array',
        ];
    }

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
        return $this->belongsTo(AssessmentAssignment::class, 'assignment_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AssessmentResponse::class, 'attempt_id');
    }

    public function proctoringEvents(): HasMany
    {
        return $this->hasMany(AssessmentProctoringEvent::class, 'attempt_id');
    }

    public function hasExpired(): bool
    {
        if ($this->status !== 'in_progress') {
            return false;
        }

        $deadline = $this->started_at->copy()->addMinutes($this->assessment->duration_minutes);

        return now()->gt($deadline);
    }

    public function remainingTimeInSeconds(): int
    {
        if ($this->status !== 'in_progress') {
            return 0;
        }

        $deadline = $this->started_at->copy()->addMinutes($this->assessment->duration_minutes);
        $remaining = now()->diffInSeconds($deadline, false);

        return max(0, $remaining);
    }

    public function calculateScore(): void
    {
        $responses = $this->responses()
            ->with([
                'question:id,points',
                'selectedOption:id,is_correct',
            ])
            ->get();

        $maxScore = (int) $this->assessment()->withSum('questions', 'points')->first()?->questions_sum_points;
        $score = 0;

        foreach ($responses as $response) {
            $isCorrect = (bool) $response->selectedOption?->is_correct;
            $pointsEarned = $isCorrect ? (int) ($response->question?->points ?? 0) : 0;

            if ($response->is_correct !== $isCorrect || (int) $response->points_earned !== $pointsEarned) {
                $response->forceFill([
                    'is_correct' => $isCorrect,
                    'points_earned' => $pointsEarned,
                ])->save();
            }

            $score += $pointsEarned;
        }

        $percentage = $maxScore === 0 ? 0 : round(($score / $maxScore) * 100, 2);

        $this->forceFill([
            'score' => $score,
            'max_score' => $maxScore,
            'percentage' => $percentage,
        ])->save();
    }
}
