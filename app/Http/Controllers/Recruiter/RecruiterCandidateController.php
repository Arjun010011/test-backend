<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruiter\AttachCandidateToCollectionRequest;
use App\Http\Requests\Recruiter\CandidateIndexRequest;
use App\Http\Requests\Recruiter\GlobalUpdateCandidateRequest;
use App\Http\Requests\Recruiter\StoreRecruiterCommentRequest;
use App\Http\Requests\Recruiter\UpdateCandidateStatusRequest;
use App\Http\Requests\Recruiter\UpdateRecruiterCommentRequest;
use App\Http\Resources\Recruiter\RecruiterCandidateResource;
use App\Http\Resources\Recruiter\RecruiterCollectionResource;
use App\Http\Resources\Recruiter\RecruiterCommentResource;
use App\Models\CandidateProfile;
use App\Models\RecruiterCollection;
use App\Models\RecruiterComment;
use App\Models\User;
use App\Services\RecruiterService;
use App\Support\CandidateStatusCatalog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

class RecruiterCandidateController extends Controller
{
    public function index(CandidateIndexRequest $request, RecruiterService $recruiterService, CandidateStatusCatalog $statusCatalog): Response
    {
        Gate::authorize('viewAny', CandidateProfile::class);

        $user = $request->user();

        abort_unless($user !== null, 403);

        $filters = [
            'search' => $request->validated('search'),
            'status' => $request->validated('status'),
            'starred' => $request->validated('starred'),
            'passed_out' => $request->validated('passed_out'),
            'collection' => $request->validated('collection'),
            'sort' => $request->validated('sort', 'latest'),
            'per_page' => $request->validated('per_page', 10),
        ];

        $candidates = $recruiterService->queryCandidates($user, $filters);

        $collections = RecruiterCollection::query()
            ->when(! $user->isSuperAdmin(), fn (Builder $query): Builder => $query->where('recruiter_id', $user->id))
            ->whereNull('parent_id')
            ->with('parent:id,name')
            ->withCount('candidates')
            ->latest()
            ->get();

        return Inertia::render('recruiter/candidates/index', [
            'candidates' => RecruiterCandidateResource::collection($candidates),
            'filters' => $filters,
            'collections' => RecruiterCollectionResource::collection($collections),
            'statuses' => $statusCatalog->options()->values(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function show(Request $request, User $candidate, RecruiterService $recruiterService, CandidateStatusCatalog $statusCatalog): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $recruiterService->assertCandidateIsVisible($user, $candidate);

        $candidate->load([
            'candidateProfile:id,user_id,skills,location,graduation_year,candidate_status,profile_completed_at,university,degree,major,is_currently_studying,current_semester,total_semesters,semester_recorded_at,achievements,hackathons_experience,projects_description,profile_photo_path',
            'resumes' => fn ($query) => $query
                ->select('id', 'user_id', 'original_name', 'file_size', 'extracted_skills', 'is_primary', 'created_at')
                ->where('is_primary', true)
                ->latest('created_at')
                ->limit(1),
            'recruiterCollections' => fn ($query) => $query
                ->select('recruiter_collections.id', 'recruiter_collections.recruiter_id', 'name')
                ->when(! $user->isSuperAdmin(), fn ($collectionQuery) => $collectionQuery->where('recruiter_id', $user->id)),
        ])->loadCount([
            'starredByRecruiters as stars_count',
            'candidateComments as comments_count',
        ])->loadExists([
            'starredByRecruiters as is_starred' => fn (Builder $query): Builder => $query->where('recruiter_id', $user->id),
        ]);

        $comments = RecruiterComment::query()
            ->where('candidate_user_id', $candidate->id)
            ->when(! $user->isSuperAdmin(), fn (Builder $query): Builder => $query->where('recruiter_id', $user->id))
            ->with('recruiter:id,name,email')
            ->latest()
            ->get();

        $collections = RecruiterCollection::query()
            ->when(! $user->isSuperAdmin(), fn (Builder $query): Builder => $query->where('recruiter_id', $user->id))
            ->whereNull('parent_id')
            ->withCount('candidates')
            ->latest()
            ->get();

        return Inertia::render('recruiter/candidates/show', [
            'candidate' => RecruiterCandidateResource::make($candidate)->resolve($request),
            'comments' => RecruiterCommentResource::collection($comments),
            'collections' => RecruiterCollectionResource::collection($collections),
            'statuses' => $statusCatalog->options()->values(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function toggleStar(Request $request, User $candidate, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $starred = $recruiterService->toggleStar($user, $candidate);

        return back()->with('status', $starred ? 'candidate-starred' : 'candidate-unstarred');
    }

    public function updateStatus(UpdateCandidateStatusRequest $request, User $candidate, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $recruiterService->updateCandidateStatus(
            $user,
            $candidate,
            $request->validated('status'),
            $request->validated('note'),
        );

        return back()->with('status', 'candidate-status-updated');
    }

    public function update(GlobalUpdateCandidateRequest $request, User $candidate, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $recruiterService->globalCandidateUpdate(
            $user,
            $candidate,
            $request->validated('status'),
            $request->validated('comment'),
            $request->validated('collections') ?? [],
        );

        return back()->with('status', 'candidate-updated');
    }

    public function destroy(Request $request, User $candidate, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $recruiterService->deleteCandidate($user, $candidate);

        return to_route('recruiter.candidates.index')->with('status', 'candidate-deleted');
    }

    public function storeComment(StoreRecruiterCommentRequest $request, User $candidate, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $recruiterService->addComment(
            $user,
            $candidate,
            $request->validated('body'),
        );

        return back()->with('status', 'candidate-comment-added');
    }

    public function updateComment(
        UpdateRecruiterCommentRequest $request,
        User $candidate,
        RecruiterComment $comment,
        RecruiterService $recruiterService,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user !== null, 403);
        abort_unless($comment->candidate_user_id === $candidate->id, 404);
        $recruiterService->assertCandidateIsVisible($user, $candidate);
        Gate::authorize('update', $comment);

        $comment->forceFill([
            'body' => $request->validated('body'),
        ])->save();

        return back()->with('status', 'candidate-comment-updated');
    }

    public function destroyComment(Request $request, User $candidate, RecruiterComment $comment, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);
        abort_unless($comment->candidate_user_id === $candidate->id, 404);
        $recruiterService->assertCandidateIsVisible($user, $candidate);
        Gate::authorize('delete', $comment);

        $comment->delete();

        return back()->with('status', 'candidate-comment-deleted');
    }

    public function attachToCollection(AttachCandidateToCollectionRequest $request, User $candidate, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $collection = RecruiterCollection::query()->findOrFail($request->integer('collection_id'));

        Gate::authorize('view', $collection);

        $recruiterService->addCandidateToCollection($user, $candidate, $collection);

        return back()->with('status', 'candidate-added-to-collection');
    }

    public function removeFromCollection(Request $request, User $candidate, RecruiterCollection $collection, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        Gate::authorize('view', $collection);

        $recruiterService->removeCandidateFromCollection($user, $candidate, $collection);

        return back()->with('status', 'candidate-removed-from-collection');
    }

    public function downloadResume(Request $request, User $candidate, RecruiterService $recruiterService): SymfonyResponse|RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        $recruiterService->assertCandidateIsVisible($user, $candidate);

        $resume = $candidate->resumes()->where('is_primary', true)->latest()->firstOrFail();
        $disk = config('resume.storage_disk', config('filesystems.default', 'local'));
        $storage = Storage::disk($disk);

        if (! $storage->exists($resume->file_path) && $disk !== 'local') {
            $localStorage = Storage::disk('local');

            if ($localStorage->exists($resume->file_path)) {
                $disk = 'local';
                $storage = $localStorage;
            }
        }

        $driver = config("filesystems.disks.{$disk}.driver");

        abort_unless($storage->exists($resume->file_path), 404);

        if ($driver === 's3') {
            return redirect()->away(
                $storage->temporaryUrl(
                    $resume->file_path,
                    now()->addMinutes(5),
                    [
                        'ResponseContentType' => $resume->mime_type,
                        'ResponseContentDisposition' => sprintf('inline; filename="%s"', $resume->original_name),
                    ],
                ),
            );
        }

        return $storage->response(
            $resume->file_path,
            $resume->original_name,
            [
                'Content-Type' => $resume->mime_type,
            ],
            ResponseHeaderBag::DISPOSITION_INLINE,
        );
    }
}
