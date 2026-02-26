<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CandidateProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone',
        'university',
        'degree',
        'major',
        'cgpa',
        'graduation_year',
        'skills',
        'skill_categories',
        'bio',
        'location',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'postal_code',
        'linkedin_url',
        'github_url',
        'portfolio_url',
        'profile_completed_at',
    ];

    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'skill_categories' => 'array',
            'profile_completed_at' => 'datetime',
        ];
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  list<string>  $skills
     */
    public function scopeWithSkills(Builder $query, array $skills): Builder
    {
        foreach ($skills as $skill) {
            $query->whereJsonContains('skills', $skill);
        }

        return $query;
    }
}
