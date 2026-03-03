<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'created_by_user_id',
        'owner_user_id',
        'approved_by_user_id',
        'name',
        'job_role',
        'website',
        'location',
        'description',
        'salary_min_lpa',
        'salary_max_lpa',
        'experience_min_years',
        'experience_max_years',
        'employment_type',
        'work_mode',
        'openings',
        'skills_required',
        'application_deadline',
        'source',
        'approval_status',
        'visibility',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'salary_min_lpa' => 'decimal:2',
            'salary_max_lpa' => 'decimal:2',
            'experience_min_years' => 'decimal:1',
            'experience_max_years' => 'decimal:1',
            'application_deadline' => 'date',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(CompanyApplication::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
