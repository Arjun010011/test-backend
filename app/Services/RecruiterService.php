<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\CandidateProfile;
use App\Models\CandidateStatusHistory;
use App\Models\RecruiterCollection;
use App\Models\RecruiterComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RecruiterService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function queryCandidates(User $recruiter, array $filters): LengthAwarePaginator
    {
        $effectiveCollectionIds = $this->effectiveCollectionFilterIds($recruiter, $filters['collection'] ?? null);

        $query = $this->baseCandidateQuery($recruiter)
            ->when(
                filled($filters['search'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);
                    $normalizedSearch = mb_strtolower($search);

                    $builder->where(function (Builder $where) use ($search, $normalizedSearch): void {
                        $where->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhereHas('resumes', function (Builder $resumeQuery) use ($normalizedSearch): void {
                                $this->whereJsonArrayContainsInsensitive($resumeQuery, 'extracted_skills', $normalizedSearch)
                                    ->orWhereRaw('LOWER(COALESCE(raw_text, \'\')) LIKE ?', ["%{$normalizedSearch}%"]);
                            })
                            ->orWhereHas('candidateProfile', function (Builder $profileQuery) use ($normalizedSearch): void {
                                $this->whereJsonArrayContainsInsensitive($profileQuery, 'skills', $normalizedSearch);
                            });
                    });
                },
            )
            ->when(
                isset($filters['starred']) && (bool) $filters['starred'] === true,
                fn (Builder $builder): Builder => $builder->whereHas('starredByRecruiters', fn (Builder $starredQuery): Builder => $starredQuery->where('recruiter_id', $recruiter->id)),
            )
            ->when(
                isset($filters['passed_out']) && (bool) $filters['passed_out'] === true,
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $this->whereCandidatePassedOut($profileQuery)),
            )
            ->when(
                isset($filters['has_resume']) && (bool) $filters['has_resume'] === true,
                fn (Builder $builder): Builder => $builder->whereHas('resumes', fn (Builder $resumeQuery): Builder => $resumeQuery->where('is_primary', true)),
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('candidate_status', $filters['status'])),
            )
            ->when(
                filled($filters['include_keywords'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $keywords = $this->normalizeKeywords($filters['include_keywords']);

                    foreach ($keywords as $keyword) {
                        $builder->where(function (Builder $keywordQuery) use ($keyword): void {
                            $this->applyKeywordMatch($keywordQuery, $keyword);
                        });
                    }
                },
            )
            ->when(
                filled($filters['exclude_keywords'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $keywords = $this->normalizeKeywords($filters['exclude_keywords']);

                    foreach ($keywords as $keyword) {
                        $builder->whereNot(function (Builder $keywordQuery) use ($keyword): void {
                            $this->applyKeywordMatch($keywordQuery, $keyword);
                        });
                    }
                },
            )
            ->when(
                filled($filters['city'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('city', 'like', '%'.trim((string) $filters['city']).'%')),
            )
            ->when(
                filled($filters['experience_min'] ?? null) || filled($filters['experience_max'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $builder->whereHas('candidateProfile', function (Builder $profileQuery) use ($filters): void {
                        if (filled($filters['experience_min'] ?? null)) {
                            $profileQuery->where('experience_years', '>=', (float) $filters['experience_min']);
                        }

                        if (filled($filters['experience_max'] ?? null)) {
                            $profileQuery->where('experience_years', '<=', (float) $filters['experience_max']);
                        }
                    });
                },
            )
            ->when(
                filled($filters['industries'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $industries = collect(is_array($filters['industries']) ? $filters['industries'] : [])
                        ->map(fn ($value): string => trim((string) $value))
                        ->filter(fn (string $value): bool => $value !== '')
                        ->values()
                        ->all();

                    if ($industries === []) {
                        return;
                    }

                    $builder->whereHas('candidateProfile', function (Builder $profileQuery) use ($industries): void {
                        $profileQuery->where(function (Builder $where) use ($industries): void {
                            foreach ($industries as $index => $industry) {
                                $boolean = $index === 0 ? 'and' : 'or';
                                $this->whereJsonArrayContainsInsensitive(
                                    $where,
                                    'industries',
                                    mb_strtolower($industry),
                                    $boolean,
                                );
                            }
                        });
                    });
                },
            )
            ->when(
                filled($filters['current_company'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('current_company', 'like', '%'.trim((string) $filters['current_company']).'%')),
            )
            ->when(
                filled($filters['previous_company'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('previous_company', 'like', '%'.trim((string) $filters['previous_company']).'%')),
            )
            ->when(
                filled($filters['salary_min'] ?? null) || filled($filters['salary_max'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $builder->whereHas('candidateProfile', function (Builder $profileQuery) use ($filters): void {
                        if (filled($filters['salary_min'] ?? null)) {
                            $profileQuery->where('annual_salary_lpa', '>=', (float) $filters['salary_min']);
                        }

                        if (filled($filters['salary_max'] ?? null)) {
                            $profileQuery->where('annual_salary_lpa', '<=', (float) $filters['salary_max']);
                        }
                    });
                },
            )
            ->when(
                filled($filters['degree'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('degree', 'like', '%'.trim((string) $filters['degree']).'%')),
            )
            ->when(
                filled($filters['major'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('major', 'like', '%'.trim((string) $filters['major']).'%')),
            )
            ->when(
                filled($filters['university'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('university', 'like', '%'.trim((string) $filters['university']).'%')),
            )
            ->when(
                filled($filters['gender'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('gender', $filters['gender'])),
            )
            ->when(
                filled($filters['age_min'] ?? null) || filled($filters['age_max'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $builder->whereHas('candidateProfile', function (Builder $profileQuery) use ($filters): void {
                        $today = now()->startOfDay();

                        if (filled($filters['age_min'] ?? null)) {
                            $maxDob = $today->copy()->subYears((int) $filters['age_min'])->endOfDay();
                            $profileQuery->whereDate('date_of_birth', '<=', $maxDob->toDateString());
                        }

                        if (filled($filters['age_max'] ?? null)) {
                            $minDob = $today->copy()->subYears((int) $filters['age_max'])->startOfDay();
                            $profileQuery->whereDate('date_of_birth', '>=', $minDob->toDateString());
                        }
                    });
                },
            )
            ->when(
                filled($filters['languages'] ?? null),
                function (Builder $builder) use ($filters): void {
                    $languages = collect(is_array($filters['languages']) ? $filters['languages'] : [])
                        ->map(fn ($value): string => trim((string) $value))
                        ->filter(fn (string $value): bool => $value !== '')
                        ->values()
                        ->all();

                    if ($languages === []) {
                        return;
                    }

                    $builder->whereHas('candidateProfile', function (Builder $profileQuery) use ($languages): void {
                        $profileQuery->where(function (Builder $where) use ($languages): void {
                            foreach ($languages as $index => $language) {
                                $boolean = $index === 0 ? 'and' : 'or';
                                $this->whereJsonArrayContainsInsensitive(
                                    $where,
                                    'languages',
                                    mb_strtolower($language),
                                    $boolean,
                                );
                            }
                        });
                    });
                },
            )
            ->when(
                filled($filters['english_fluency'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('english_fluency', $filters['english_fluency'])),
            )
            ->when(
                $effectiveCollectionIds !== [],
                fn (Builder $builder): Builder => $builder->whereHas(
                    'recruiterCollections',
                    fn (Builder $collectionQuery): Builder => $collectionQuery->whereIn('recruiter_collections.id', $effectiveCollectionIds),
                ),
            )
            ->when(
                ($filters['sort'] ?? 'latest') === 'most_starred',
                fn (Builder $builder): Builder => $builder->orderByDesc('stars_count')->orderByDesc('users.created_at'),
                fn (Builder $builder): Builder => $builder->latest('users.created_at'),
            );

        return $query
            ->paginate((int) ($filters['per_page'] ?? 10))
            ->withQueryString();
    }

    /**
     * @return array<string, int>
     */
    public function dashboardStats(User $recruiter): array
    {
        $base = $this->visibleCandidatesQuery($recruiter);

        $totalCandidates = (clone $base)->count();
        $starredCandidates = (clone $base)
            ->whereHas('starredByRecruiters', fn (Builder $query): Builder => $query->where('recruiter_id', $recruiter->id))
            ->count();
        $recentlyAdded = (clone $base)
            ->where('users.created_at', '>=', now()->subDays(7))
            ->count();

        $activeCollections = RecruiterCollection::query()
            ->when(! $recruiter->isSuperAdmin(), fn (Builder $query): Builder => $query->where('recruiter_id', $recruiter->id))
            ->count();

        return [
            'total_candidates' => $totalCandidates,
            'starred_candidates' => $starredCandidates,
            'active_collections' => $activeCollections,
            'recently_added' => $recentlyAdded,
        ];
    }

    public function toggleStar(User $recruiter, User $candidate): bool
    {
        $this->assertCandidateIsVisible($recruiter, $candidate);

        $alreadyStarred = $recruiter->recruiterStarredCandidates()->whereKey($candidate->id)->exists();

        if ($alreadyStarred) {
            $recruiter->recruiterStarredCandidates()->detach($candidate->id);

            return false;
        }

        $recruiter->recruiterStarredCandidates()->attach($candidate->id);

        return true;
    }

    public function updateCandidateStatus(User $recruiter, User $candidate, string $status, ?string $note = null): void
    {
        $this->assertCandidateIsVisible($recruiter, $candidate);

        DB::transaction(function () use ($recruiter, $candidate, $status, $note): void {
            $profile = CandidateProfile::query()->firstOrCreate(
                ['user_id' => $candidate->id],
                ['candidate_status' => 'new'],
            );

            $fromStatus = $profile->candidate_status;

            $profile->forceFill([
                'candidate_status' => $status,
            ])->save();

            CandidateStatusHistory::query()->create([
                'candidate_user_id' => $candidate->id,
                'recruiter_id' => $recruiter->id,
                'from_status' => $fromStatus,
                'to_status' => $status,
                'note' => $note,
            ]);
        });
    }

    public function addComment(User $recruiter, User $candidate, string $body): RecruiterComment
    {
        $this->assertCandidateIsVisible($recruiter, $candidate);

        return RecruiterComment::query()->create([
            'recruiter_id' => $recruiter->id,
            'candidate_user_id' => $candidate->id,
            'body' => $body,
        ]);
    }

    public function deleteCandidate(User $recruiter, User $candidate): void
    {
        $this->assertCandidateIsVisible($recruiter, $candidate);

        DB::transaction(function () use ($candidate): void {
            $resumePaths = $candidate->resumes()
                ->pluck('file_path')
                ->filter()
                ->values();
            $profilePhotoPath = CandidateProfile::query()
                ->where('user_id', $candidate->id)
                ->value('profile_photo_path');

            $candidate->delete();

            $pathsToDelete = $resumePaths
                ->when(
                    is_string($profilePhotoPath) && $profilePhotoPath !== '',
                    fn ($paths) => $paths->push($profilePhotoPath),
                )
                ->values();

            if ($pathsToDelete->isNotEmpty()) {
                $disk = config('resume.storage_disk', config('filesystems.default', 'local'));
                Storage::disk($disk)->delete($pathsToDelete->all());

                if ($disk !== 'local') {
                    Storage::disk('local')->delete($pathsToDelete->all());
                }
            }
        });
    }

    public function createCollection(User $recruiter, string $name, ?string $description = null, ?int $parentId = null): RecruiterCollection
    {
        $parent = null;

        if ($parentId !== null) {
            $parent = RecruiterCollection::query()->findOrFail($parentId);
            $this->assertCollectionAccess($recruiter, $parent);
        }

        return RecruiterCollection::query()->create([
            'recruiter_id' => $recruiter->id,
            'parent_id' => $parent?->id,
            'name' => $name,
            'description' => $description,
        ]);
    }

    public function updateCollection(User $recruiter, RecruiterCollection $collection, string $name, ?string $description = null, ?int $parentId = null): void
    {
        $this->assertCollectionAccess($recruiter, $collection);
        $parent = null;

        if ($parentId !== null) {
            $parent = RecruiterCollection::query()->findOrFail($parentId);
            $this->assertCollectionAccess($recruiter, $parent);
            abort_unless($parent->id !== $collection->id, 422);

            $descendantIds = $this->collectionDescendantIds($collection->id);

            abort_unless(! in_array($parent->id, $descendantIds, true), 422);
        }

        $collection->forceFill([
            'name' => $name,
            'description' => $description,
            'parent_id' => $parent?->id,
        ])->save();
    }

    public function deleteCollection(User $recruiter, RecruiterCollection $collection): void
    {
        $this->assertCollectionAccess($recruiter, $collection);

        $collection->delete();
    }

    public function addCandidateToCollection(User $recruiter, User $candidate, RecruiterCollection $collection): void
    {
        $this->assertCollectionAccess($recruiter, $collection);
        $this->assertCandidateIsVisible($recruiter, $candidate);

        $collection->candidates()->syncWithoutDetaching([
            $candidate->id => ['added_by_recruiter_id' => $recruiter->id],
        ]);
    }

    public function removeCandidateFromCollection(User $recruiter, User $candidate, RecruiterCollection $collection): void
    {
        $this->assertCollectionAccess($recruiter, $collection);
        $this->assertCandidateIsVisible($recruiter, $candidate);

        $collection->candidates()->detach($candidate->id);
    }

    /**
     * @param  array<int>  $collectionIds
     */
    public function globalCandidateUpdate(User $recruiter, User $candidate, string $status, ?string $comment, array $collectionIds): void
    {
        $this->assertCandidateIsVisible($recruiter, $candidate);

        DB::transaction(function () use ($recruiter, $candidate, $status, $comment, $collectionIds): void {
            // Update Candidate Status if changed
            $profile = CandidateProfile::query()->firstOrCreate(
                ['user_id' => $candidate->id],
                ['candidate_status' => 'new'],
            );

            if ($profile->candidate_status !== $status) {
                $fromStatus = $profile->candidate_status;
                $profile->forceFill(['candidate_status' => $status])->save();

                CandidateStatusHistory::query()->create([
                    'candidate_user_id' => $candidate->id,
                    'recruiter_id' => $recruiter->id,
                    'from_status' => $fromStatus,
                    'to_status' => $status,
                ]);
            }

            // Add private comment if provided
            if (filled($comment)) {
                $this->addComment($recruiter, $candidate, $comment);
            }

            // Sync collections that belong only to this recruiter (or any for SuperAdmin)
            $validCollections = RecruiterCollection::query()
                ->when(! $recruiter->isSuperAdmin(), fn ($q) => $q->where('recruiter_id', $recruiter->id))
                ->whereIn('id', $collectionIds)
                ->pluck('id');

            // Detach candidate from ALL currently assigned collections visible to recruiter, then re-attach correctly
            $currentCollectionIds = $candidate->recruiterCollections()
                ->when(! $recruiter->isSuperAdmin(), fn ($q) => $q->where('recruiter_collections.recruiter_id', $recruiter->id))
                ->pluck('recruiter_collections.id');

            $candidate->recruiterCollections()->detach($currentCollectionIds);

            if ($validCollections->isNotEmpty()) {
                $syncData = $validCollections->mapWithKeys(fn ($id) => [$id => ['added_by_recruiter_id' => $recruiter->id]])->toArray();
                $candidate->recruiterCollections()->syncWithoutDetaching($syncData);
            }
        });
    }

    public function assertCandidateIsVisible(User $recruiter, User $candidate): void
    {
        $exists = $this->visibleCandidatesQuery($recruiter)
            ->whereKey($candidate->id)
            ->exists();

        abort_unless($exists, 403);
    }

    protected function assertCollectionAccess(User $recruiter, RecruiterCollection $collection): void
    {
        if ($recruiter->isSuperAdmin()) {
            return;
        }

        abort_unless($collection->recruiter_id === $recruiter->id, 403);
    }

    /**
     * @return list<int>
     */
    protected function effectiveCollectionFilterIds(User $recruiter, mixed $collectionId): array
    {
        if (! filled($collectionId)) {
            return [];
        }

        $collection = RecruiterCollection::query()->find((int) $collectionId);

        if ($collection === null) {
            return [];
        }

        $this->assertCollectionAccess($recruiter, $collection);

        return array_values(array_unique([
            $collection->id,
            ...$this->collectionAncestorIds($collection),
        ]));
    }

    /**
     * @return list<int>
     */
    protected function collectionAncestorIds(RecruiterCollection $collection): array
    {
        $ancestorIds = [];
        $current = $collection->parent_id === null
            ? null
            : RecruiterCollection::query()->find($collection->parent_id);

        while ($current !== null) {
            $ancestorIds[] = (int) $current->id;

            if ($current->parent_id === null) {
                break;
            }

            $current = RecruiterCollection::query()->find($current->parent_id);
        }

        return $ancestorIds;
    }

    /**
     * @return list<int>
     */
    protected function collectionDescendantIds(int $collectionId): array
    {
        $descendantIds = [];
        $pending = [$collectionId];

        while ($pending !== []) {
            $children = RecruiterCollection::query()
                ->whereIn('parent_id', $pending)
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all();

            if ($children === []) {
                break;
            }

            $descendantIds = [...$descendantIds, ...$children];
            $pending = $children;
        }

        return $descendantIds;
    }

    protected function baseCandidateQuery(User $recruiter): Builder
    {
        return $this->visibleCandidatesQuery($recruiter)
            ->withCount([
                'starredByRecruiters as stars_count',
                'candidateComments as comments_count',
            ])
            ->withExists([
                'starredByRecruiters as is_starred' => fn (Builder $query): Builder => $query->where('recruiter_id', $recruiter->id),
            ])
            ->with([
                'candidateProfile:id,user_id,skills,location,graduation_year,candidate_status,profile_completed_at,university,degree,major,is_currently_studying,current_semester,total_semesters,semester_recorded_at,achievements,hackathons_experience,projects_description,profile_photo_path',
                'resumes' => fn ($query) => $query
                    ->select('id', 'user_id', 'original_name', 'file_size', 'extracted_skills', 'is_primary', 'created_at')
                    ->where('is_primary', true)
                    ->latest('created_at')
                    ->limit(1),
                'recruiterCollections' => fn ($query) => $query
                    ->select('recruiter_collections.id', 'recruiter_collections.recruiter_id', 'name')
                    ->when(
                        ! $recruiter->isSuperAdmin(),
                        fn (Builder $collectionQuery): Builder => $collectionQuery->where('recruiter_collections.recruiter_id', $recruiter->id),
                    ),
            ]);
    }

    protected function visibleCandidatesQuery(User $recruiter): Builder
    {
        return User::query()
            ->where('role', Role::Candidate)
            ->when(
                ! $recruiter->isSuperAdmin(),
                fn (Builder $query): Builder => $query->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->whereNotNull('profile_completed_at')),
            );
    }

    protected function whereJsonArrayContainsInsensitive(
        Builder $query,
        string $column,
        string $normalizedNeedle,
        string $boolean = 'and',
    ): Builder {
        $driver = $query->getModel()->getConnection()->getDriverName();

        return match ($driver) {
            'mysql', 'mariadb' => $query->whereRaw(
                "JSON_SEARCH(LOWER(CAST(COALESCE({$column}, JSON_ARRAY()) AS CHAR)), 'one', ?) IS NOT NULL",
                [$normalizedNeedle],
                $boolean,
            ),
            'pgsql' => $query->whereRaw(
                "LOWER(COALESCE({$column}::text, '[]')) LIKE ?",
                ['%"'.$normalizedNeedle.'"%'],
                $boolean,
            ),
            default => $query->whereRaw(
                "LOWER(COALESCE({$column}, '[]')) LIKE ?",
                ['%"'.$normalizedNeedle.'"%'],
                $boolean,
            ),
        };
    }

    /**
     * @return list<string>
     */
    protected function normalizeKeywords(mixed $input): array
    {
        $values = is_array($input)
            ? $input
            : (is_string($input) ? preg_split('/[,\n;]+/u', $input) : []);

        return collect($values)
            ->map(fn ($value): string => trim((string) $value))
            ->filter(fn (string $value): bool => $value !== '')
            ->values()
            ->all();
    }

    protected function applyKeywordMatch(Builder $builder, string $keyword): void
    {
        $normalized = mb_strtolower($keyword);

        $builder->where(function (Builder $where) use ($keyword, $normalized): void {
            $where->where('name', 'like', "%{$keyword}%")
                ->orWhere('email', 'like', "%{$keyword}%")
                ->orWhereHas('resumes', function (Builder $resumeQuery) use ($normalized): void {
                    $this->whereJsonArrayContainsInsensitive($resumeQuery, 'extracted_skills', $normalized)
                        ->orWhereRaw('LOWER(COALESCE(raw_text, \'\')) LIKE ?', ["%{$normalized}%"]);
                })
                ->orWhereHas('candidateProfile', function (Builder $profileQuery) use ($normalized): void {
                    $this->whereJsonArrayContainsInsensitive($profileQuery, 'skills', $normalized)
                        ->orWhere('location', 'like', "%{$normalized}%")
                        ->orWhere('city', 'like', "%{$normalized}%")
                        ->orWhere('state', 'like', "%{$normalized}%")
                        ->orWhere('university', 'like', "%{$normalized}%")
                        ->orWhere('degree', 'like', "%{$normalized}%")
                        ->orWhere('major', 'like', "%{$normalized}%")
                        ->orWhere('current_company', 'like', "%{$normalized}%")
                        ->orWhere('previous_company', 'like', "%{$normalized}%")
                        ->orWhere('projects_description', 'like', "%{$normalized}%")
                        ->orWhere('achievements', 'like', "%{$normalized}%")
                        ->orWhere('hackathons_experience', 'like', "%{$normalized}%");

                    $this->whereJsonArrayContainsInsensitive($profileQuery, 'industries', $normalized, 'or');
                    $this->whereJsonArrayContainsInsensitive($profileQuery, 'languages', $normalized, 'or');
                });
        });
    }

    protected function whereCandidatePassedOut(Builder $query): Builder
    {
        $year = (int) now()->year;

        return $query->where(function (Builder $completedQuery) use ($year): void {
            $completedQuery->where('graduation_year', '<=', $year)
                ->orWhere(function (Builder $semesterQuery): void {
                    $semesterQuery->where('is_currently_studying', true)
                        ->whereNotNull('current_semester')
                        ->whereNotNull('total_semesters')
                        ->whereNotNull('semester_recorded_at')
                        ->whereRaw($this->projectedSemesterSql().' >= total_semesters');
                });
        });
    }

    protected function projectedSemesterSql(): string
    {
        return match (DB::connection()->getDriverName()) {
            'mysql', 'mariadb' => 'current_semester + FLOOR(GREATEST(TIMESTAMPDIFF(MONTH, semester_recorded_at, CURRENT_DATE), 0) / 6)',
            'pgsql' => 'current_semester + FLOOR(GREATEST((EXTRACT(YEAR FROM AGE(CURRENT_DATE, semester_recorded_at)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, semester_recorded_at))), 0) / 6)',
            default => "current_semester + CAST((MAX((((CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', semester_recorded_at) AS INTEGER)) * 12) + (CAST(strftime('%m', 'now') AS INTEGER) - CAST(strftime('%m', semester_recorded_at) AS INTEGER))), 0)) / 6 AS INTEGER)",
        };
    }
}
