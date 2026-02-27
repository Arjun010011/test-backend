<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruiter\CandidateIndexRequest;
use App\Http\Requests\Recruiter\StoreRecruiterCollectionRequest;
use App\Http\Requests\Recruiter\UpdateRecruiterCollectionRequest;
use App\Http\Resources\Recruiter\RecruiterCandidateResource;
use App\Http\Resources\Recruiter\RecruiterCollectionResource;
use App\Models\RecruiterCollection;
use App\Services\RecruiterService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterCollectionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        Gate::authorize('viewAny', RecruiterCollection::class);

        $collections = RecruiterCollection::query()
            ->when(! $user->isSuperAdmin(), fn (Builder $query): Builder => $query->where('recruiter_id', $user->id))
            ->with('parent:id,name')
            ->withCount('candidates')
            ->latest()
            ->get();

        return Inertia::render('recruiter/collections/index', [
            'collections' => RecruiterCollectionResource::collection($collections),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(StoreRecruiterCollectionRequest $request, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        Gate::authorize('create', RecruiterCollection::class);

        $recruiterService->createCollection(
            $user,
            $request->validated('name'),
            $request->validated('description'),
            $request->validated('parent_id'),
        );

        return back()->with('status', 'collection-created');
    }

    public function show(CandidateIndexRequest $request, RecruiterCollection $collection, RecruiterService $recruiterService): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);

        Gate::authorize('view', $collection);

        $filters = [
            'search' => $request->validated('search'),
            'status' => $request->validated('status'),
            'starred' => $request->validated('starred'),
            'collection' => $collection->id,
            'sort' => $request->validated('sort', 'latest'),
            'per_page' => $request->validated('per_page', 10),
        ];

        $candidates = $recruiterService->queryCandidates($user, $filters);

        return Inertia::render('recruiter/collections/show', [
            'collection' => RecruiterCollectionResource::make(
                $collection->load(['parent:id,name', 'children:id,recruiter_id,parent_id,name,description,created_at'])->loadCount('candidates'),
            )->resolve($request),
            'candidates' => RecruiterCandidateResource::collection($candidates),
            'filters' => $filters,
            'children' => RecruiterCollectionResource::collection($collection->children()->with('parent:id,name')->withCount('candidates')->latest()->get()),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(UpdateRecruiterCollectionRequest $request, RecruiterCollection $collection, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);
        Gate::authorize('update', $collection);

        $recruiterService->updateCollection(
            $user,
            $collection,
            $request->validated('name'),
            $request->validated('description'),
            $request->validated('parent_id'),
        );

        return back()->with('status', 'collection-updated');
    }

    public function destroy(Request $request, RecruiterCollection $collection, RecruiterService $recruiterService): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null, 403);
        Gate::authorize('delete', $collection);

        $recruiterService->deleteCollection($user, $collection);

        return to_route('recruiter.collections.index')->with('status', 'collection-deleted');
    }
}
