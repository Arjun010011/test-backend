<?php

namespace App\Models;

use App\Enums\CandidateStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

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
        'is_currently_studying',
        'current_semester',
        'total_semesters',
        'semester_recorded_at',
        'skills',
        'skill_categories',
        'candidate_status',
        'bio',
        'achievements',
        'hackathons_experience',
        'projects_description',
        'location',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'district',
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
            'candidate_status' => CandidateStatus::class,
            'is_currently_studying' => 'boolean',
            'current_semester' => 'integer',
            'total_semesters' => 'integer',
            'semester_recorded_at' => 'date',
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
        $driver = $query->getModel()->getConnection()->getDriverName();

        foreach ($skills as $skill) {
            $normalizedSkill = mb_strtolower(trim($skill));

            if ($normalizedSkill === '') {
                continue;
            }

            match ($driver) {
                'mysql', 'mariadb' => $query->whereRaw(
                    "JSON_SEARCH(LOWER(CAST(COALESCE(skills, JSON_ARRAY()) AS CHAR)), 'one', ?) IS NOT NULL",
                    [$normalizedSkill],
                ),
                'pgsql' => $query->whereRaw(
                    "LOWER(COALESCE(skills::text, '[]')) LIKE ?",
                    ['%"'.$normalizedSkill.'"%'],
                ),
                default => $query->whereRaw(
                    "LOWER(COALESCE(skills, '[]')) LIKE ?",
                    ['%"'.$normalizedSkill.'"%'],
                ),
            };
        }

        return $query;
    }

    /**
     * @return array{
     *     is_currently_studying: bool,
     *     current_semester: int|null,
     *     total_semesters: int|null,
     *     projected_semester: int|null,
     *     is_completed: bool,
     *     status_label: string
     * }
     */
    public function educationStatus(?Carbon $asOf = null): array
    {
        $asOf ??= now();
        $isCurrentlyStudying = (bool) $this->is_currently_studying;
        $currentSemester = $this->current_semester === null ? null : (int) $this->current_semester;
        $totalSemesters = $this->total_semesters === null ? null : (int) $this->total_semesters;

        if (! $isCurrentlyStudying || $currentSemester === null || $totalSemesters === null) {
            $isCompletedByYear = $this->graduation_year !== null && (int) $this->graduation_year <= (int) $asOf->year;

            return [
                'is_currently_studying' => false,
                'current_semester' => null,
                'total_semesters' => null,
                'projected_semester' => null,
                'is_completed' => $isCompletedByYear,
                'status_label' => $isCompletedByYear ? 'Completed' : 'Degree status unavailable',
            ];
        }

        $recordedAt = $this->semester_recorded_at ?? $asOf->copy();
        $elapsedMonths = max(0, $recordedAt->diffInMonths($asOf, false));
        $advancedSemesters = intdiv($elapsedMonths, 6);
        $projectedSemester = min($currentSemester + $advancedSemesters, $totalSemesters);
        $isCompleted = $projectedSemester >= $totalSemesters;

        return [
            'is_currently_studying' => ! $isCompleted,
            'current_semester' => $currentSemester,
            'total_semesters' => $totalSemesters,
            'projected_semester' => $projectedSemester,
            'is_completed' => $isCompleted,
            'status_label' => $isCompleted
                ? 'Completed'
                : 'Pursuing '.$projectedSemester.$this->ordinalSuffix($projectedSemester).' semester',
        ];
    }

    protected function ordinalSuffix(int $number): string
    {
        if (($number % 100) >= 11 && ($number % 100) <= 13) {
            return 'th';
        }

        return match ($number % 10) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };
    }
}
