<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assessment extends Model
{
    use HasFactory;
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
        'status',
        'is_active',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'total_questions' => 'integer',
            'passing_score' => 'integer',
            'randomize_questions' => 'boolean',
            'show_results_immediately' => 'boolean',
            'status' => 'string',
            'is_active' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

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

    public function proctoringEvents(): HasMany
    {
        return $this->hasMany(AssessmentProctoringEvent::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at');
    }

    public function completionRate(): float
    {
        $total = $this->attempts()->count();

        if ($total === 0) {
            return 0;
        }

        $completed = $this->attempts()->where('status', 'submitted')->count();

        return round(($completed / $total) * 100, 2);
    }

    public function averageScore(): float
    {
        return (float) round(
            (float) ($this->attempts()->where('status', 'submitted')->avg('percentage') ?? 0),
            2,
        );
    }
}
