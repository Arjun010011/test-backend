<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => Role::class,
        ];
    }

    public function candidateProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CandidateProfile::class);
    }

    public function resumes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Resume::class);
    }

    public function recruiterStarredCandidates(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'recruiter_candidate_stars', 'recruiter_id', 'candidate_user_id')
            ->withTimestamps();
    }

    public function starredByRecruiters(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'recruiter_candidate_stars', 'candidate_user_id', 'recruiter_id')
            ->withTimestamps();
    }

    public function recruiterComments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RecruiterComment::class, 'recruiter_id');
    }

    public function candidateComments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RecruiterComment::class, 'candidate_user_id');
    }

    public function recruiterOwnedCollections(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RecruiterCollection::class, 'recruiter_id');
    }

    public function recruiterCollections(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(RecruiterCollection::class, 'recruiter_collection_candidate', 'candidate_user_id', 'recruiter_collection_id')
            ->withPivot('added_by_recruiter_id')
            ->withTimestamps();
    }

    public function candidateStatusHistory(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CandidateStatusHistory::class, 'candidate_user_id');
    }

    public function recruiterStatusChanges(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CandidateStatusHistory::class, 'recruiter_id');
    }

    public function createdCompanies(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Company::class, 'created_by_user_id');
    }

    public function ownedCompanies(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Company::class, 'owner_user_id');
    }

    public function companyApplications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CompanyApplication::class, 'candidate_user_id');
    }

    public function assessmentAttempts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AssessmentAttempt::class, 'candidate_id');
    }

    public function assessmentProctoringEvents(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AssessmentProctoringEvent::class, 'candidate_id');
    }

    public function isCandidate(): bool
    {
        return $this->role === Role::Candidate;
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }

    public function isCompany(): bool
    {
        return $this->role === Role::Company;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === Role::SuperAdmin;
    }

    /**
     * @param  list<string>  $skills
     */
    public function scopeCandidatesWithSkills(Builder $query, array $skills): Builder
    {
        return $query
            ->where('role', Role::Candidate)
            ->whereHas('candidateProfile', fn (Builder $profileQuery) => $profileQuery->withSkills($skills));
    }
}
