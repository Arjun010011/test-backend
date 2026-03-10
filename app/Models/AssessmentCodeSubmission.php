<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentCodeSubmission extends Model
{
    protected $fillable = [
        'attempt_id',
        'question_id',
        'submission_number',
        'language',
        'source_code',
        'status',
        'verdict',
        'runtime_ms',
        'memory_kb',
        'sample_passed_count',
        'sample_total_count',
        'hidden_passed_count',
        'hidden_total_count',
        'compile_output',
        'case_results',
    ];

    protected function casts(): array
    {
        return [
            'submission_number' => 'integer',
            'runtime_ms' => 'integer',
            'memory_kb' => 'integer',
            'sample_passed_count' => 'integer',
            'sample_total_count' => 'integer',
            'hidden_passed_count' => 'integer',
            'hidden_total_count' => 'integer',
            'case_results' => 'array',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(AssessmentAttempt::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(AssessmentQuestion::class, 'question_id');
    }

    public function passedHidden(): bool
    {
        if ($this->hidden_total_count === null) {
            return false;
        }

        return (int) ($this->hidden_passed_count ?? 0) >= (int) $this->hidden_total_count;
    }
}
