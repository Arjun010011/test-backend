<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AssessmentQuestion extends Model
{
    use HasFactory;

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

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'metadata' => 'array',
        ];
    }

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

    public function correctOption(): HasOne
    {
        return $this->hasOne(AssessmentQuestionOption::class, 'question_id')->where('is_correct', true);
    }

    public function accuracyRate(): float
    {
        $totalResponses = $this->responses()->count();

        if ($totalResponses === 0) {
            return 0;
        }

        $correctResponses = $this->responses()->where('is_correct', true)->count();

        return round(($correctResponses / $totalResponses) * 100, 2);
    }
}
