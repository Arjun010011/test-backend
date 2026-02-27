<?php

namespace App\Services;

use App\Enums\CandidateStatus;
use App\Enums\Role;
use App\Models\CandidateProfile;
use App\Models\CandidateStatusHistory;
use App\Models\RecruiterCollection;
use App\Models\RecruiterComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

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
                    $search = (string) $filters['search'];

                    $builder->where(function (Builder $where) use ($search): void {
                        $where->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhereHas('resumes', function (Builder $resumeQuery) use ($search): void {
                                $resumeQuery->whereJsonContains('extracted_skills', $search);
                            });
                    });
                },
            )
            ->when(
                isset($filters['starred']) && (bool) $filters['starred'] === true,
                fn (Builder $builder): Builder => $builder->whereHas('starredByRecruiters', fn (Builder $starredQuery): Builder => $starredQuery->where('recruiter_id', $recruiter->id)),
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $builder): Builder => $builder->whereHas('candidateProfile', fn (Builder $profileQuery): Builder => $profileQuery->where('candidate_status', $filters['status'])),
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

    public function updateCandidateStatus(User $recruiter, User $candidate, CandidateStatus $status, ?string $note = null): void
    {
        $this->assertCandidateIsVisible($recruiter, $candidate);

        DB::transaction(function () use ($recruiter, $candidate, $status, $note): void {
            $profile = CandidateProfile::query()->firstOrCreate(
                ['user_id' => $candidate->id],
                ['candidate_status' => CandidateStatus::New->value],
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
    public function globalCandidateUpdate(User $recruiter, User $candidate, CandidateStatus $status, ?string $comment, array $collectionIds): void
    {
        $this->assertCandidateIsVisible($recruiter, $candidate);

        DB::transaction(function () use ($recruiter, $candidate, $status, $comment, $collectionIds): void {
            // Update Candidate Status if changed
            $profile = CandidateProfile::query()->firstOrCreate(
                ['user_id' => $candidate->id],
                ['candidate_status' => CandidateStatus::New->value],
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
                'candidateProfile:id,user_id,skills,location,graduation_year,candidate_status,profile_completed_at,university,degree,major,is_currently_studying,current_semester,total_semesters,semester_recorded_at',
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
}
