<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CandidateStatusHistory extends Model
{
    /** @use HasFactory<\Database\Factories\CandidateStatusHistoryFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'candidate_user_id',
        'recruiter_id',
        'from_status',
        'to_status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => 'string',
            'to_status' => 'string',
        ];
    }

    public function candidate(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_user_id');
    }

    public function recruiter(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'recruiter_id');
    }
}
