import { Head, Link, router, useForm } from '@inertiajs/react';
import { Layers, Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { show as showCandidate } from '@/routes/recruiter/candidates';
import { show, store } from '@/routes/recruiter/collections';

type CollectionItem = {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    parent_name: string | null;
    candidates_count: number;
    update_url: string;
    delete_url: string;
};

type Candidate = {
    id: number;
    name: string;
    email: string;
    skills: string[];
    collections: Array<{ id: number; name: string }>;
};

type Props = {
    collection: CollectionItem;
    children: {
        data: CollectionItem[];
    };
    candidates: {
        data: Candidate[];
        meta: { current_page: number; last_page: number; total?: number };
        links: { prev: string | null; next: string | null };
    };
    filters: {
        search?: string | null;
    };
};

export default function RecruiterCollectionShow({ collection, children, candidates, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [createSubOpen, setCreateSubOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<CollectionItem | null>(null);

    const createSubForm = useForm({
        name: '',
        description: '',
        parent_id: String(collection.id),
    });

    const editChildForm = useForm({
        name: '',
        description: '',
        parent_id: String(collection.id),
    });

    const submitSearch = () => {
        router.get(
            show.url(collection.id, { query: { search: search.trim() === '' ? null : search.trim() } }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const childIds = useMemo(() => new Set(children.data.map((child) => child.id)), [children.data]);

    const assignCandidate = (candidateId: number) => {
        router.post(`/recruiter/candidates/${candidateId}/collections`, {
            collection_id: collection.id,
        }, {
            preserveScroll: true,
        });
    };

    const removeCandidate = (candidateId: number) => {
        router.delete(`/recruiter/candidates/${candidateId}/collections/${collection.id}`, {
            preserveScroll: true,
        });
    };

    const deleteChild = (child: CollectionItem) => {
        if (!window.confirm(`Delete sub-collection "${child.name}"?`)) {
            return;
        }

        router.delete(child.delete_url, {
            preserveScroll: true,
        });
    };

    const openEditChild = (child: CollectionItem) => {
        setEditingChild(child);
        editChildForm.setData({
            name: child.name,
            description: child.description ?? '',
            parent_id: child.parent_id ? String(child.parent_id) : String(collection.id),
        });
    };

    return (
        <RecruiterLayout
            title="Collection Workspace"
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={submitSearch}
        >
            <Head title={collection.name} />

            <section className="relative mb-6 overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full bg-white/10 blur-2xl" />
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Collection</div>
                        <h1 className="mt-2 text-2xl font-bold">{collection.name}</h1>
                        <p className="mt-1 text-sm text-blue-100">{collection.description ?? 'No description'}</p>
                        {collection.parent_name && (
                            <div className="mt-2 text-xs text-blue-100/90">Parent: {collection.parent_name}</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white/15 p-3">
                            <div className="text-xs text-blue-100">Candidates</div>
                            <div className="mt-1 text-xl font-semibold">{candidates.data.length}</div>
                        </div>
                        <div className="rounded-2xl bg-white/15 p-3">
                            <div className="text-xs text-blue-100">Sub-collections</div>
                            <div className="mt-1 text-xl font-semibold">{children.data.length}</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-6 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-800">Sub-collections</div>
                        <div className="text-xs text-slate-500">Create child collections and manage them directly here.</div>
                    </div>
                    <Button onClick={() => setCreateSubOpen(true)} className="rounded-xl bg-blue-700 hover:bg-blue-800">
                        <Plus className="size-4" />
                        Create sub-collection
                    </Button>
                </div>

                {children.data.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {children.data.map((child) => (
                            <div key={child.id} className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-800">{child.name}</div>
                                        <div className="text-xs text-slate-500">{child.description ?? 'No description'}</div>
                                        <div className="mt-2 text-xs text-slate-500">{child.candidates_count} candidates</div>
                                    </div>
                                    <Layers className="size-4 text-slate-400" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link
                                        href={show(child.id).url}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-100"
                                    >
                                        View
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => openEditChild(child)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-100"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteChild(child)}
                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                        No sub-collections yet.
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-800">Candidate assignment</div>
                        <div className="text-xs text-slate-500">
                            Search candidates (including inherited parent candidates) and assign them to this collection.
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">Page {candidates.meta.current_page} / {candidates.meta.last_page}</div>
                </div>

                <div className="mt-4 space-y-3">
                    {candidates.data.length > 0 ? candidates.data.map((candidate) => {
                        const assignedToCurrent = candidate.collections.some((item) => item.id === collection.id);
                        const assignedViaChild = candidate.collections.some((item) => childIds.has(item.id));

                        return (
                            <div key={candidate.id} className="rounded-xl border border-slate-200/70 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-800">{candidate.name}</div>
                                        <div className="text-xs text-slate-500">{candidate.email}</div>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {candidate.skills.slice(0, 6).map((skill) => (
                                                <span key={`${candidate.id}-${skill}`} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length === 0 && (
                                                <span className="text-xs text-slate-400">No skills listed</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={showCandidate(candidate.id).url}
                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                                        >
                                            View profile
                                        </Link>
                                        {assignedViaChild && !assignedToCurrent && (
                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                                                In child collection
                                            </span>
                                        )}
                                        {assignedToCurrent ? (
                                            <button
                                                type="button"
                                                onClick={() => removeCandidate(candidate.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => assignCandidate(candidate.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
                                            >
                                                <Users className="size-3" />
                                                Add to this collection
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            No matching candidates found. Use search to filter by name, email, or skill.
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={candidates.links.prev === null}
                        onClick={() =>
                            router.get(candidates.links.prev ?? show(collection.id).url, {}, { preserveState: true, preserveScroll: true })
                        }
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={candidates.links.next === null}
                        onClick={() =>
                            router.get(candidates.links.next ?? show(collection.id).url, {}, { preserveState: true, preserveScroll: true })
                        }
                    >
                        Next
                    </Button>
                </div>
            </section>

            <Dialog open={createSubOpen} onOpenChange={setCreateSubOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create sub-collection</DialogTitle>
                        <DialogDescription>
                            This sub-collection will be created under {collection.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            createSubForm.post(store().url, {
                                preserveScroll: true,
                                onSuccess: () => {
                                    createSubForm.reset('name', 'description');
                                    setCreateSubOpen(false);
                                },
                            });
                        }}
                    >
                        <input
                            value={createSubForm.data.name}
                            onChange={(event) => createSubForm.setData('name', event.target.value)}
                            placeholder="Sub-collection name"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <input
                            value={createSubForm.data.description}
                            onChange={(event) => createSubForm.setData('description', event.target.value)}
                            placeholder="Description"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateSubOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createSubForm.processing} className="bg-blue-700 hover:bg-blue-800">
                                {createSubForm.processing ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editingChild !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingChild(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit sub-collection</DialogTitle>
                        <DialogDescription>
                            Update this sub-collection details.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (editingChild === null) {
                                return;
                            }

                            editChildForm.put(editingChild.update_url, {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setEditingChild(null);
                                },
                            });
                        }}
                    >
                        <input
                            value={editChildForm.data.name}
                            onChange={(event) => editChildForm.setData('name', event.target.value)}
                            placeholder="Sub-collection name"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <input
                            value={editChildForm.data.description}
                            onChange={(event) => editChildForm.setData('description', event.target.value)}
                            placeholder="Description"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <input type="hidden" value={editChildForm.data.parent_id} name="parent_id" />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingChild(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editChildForm.processing} className="bg-blue-700 hover:bg-blue-800">
                                {editChildForm.processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </RecruiterLayout>
    );
}
