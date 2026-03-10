<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentQuestionTestCase extends Model
{
    protected $fillable = [
        'question_id',
        'is_sample',
        'stdin',
        'expected_stdout',
        'points',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'is_sample' => 'boolean',
            'points' => 'integer',
            'display_order' => 'integer',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(AssessmentQuestion::class, 'question_id');
    }
}
