import { Head, Link, router, useForm } from '@inertiajs/react';
import { FolderKanban, Layers, Plus, UserCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { email as sendCollectionEmail, show, store } from '@/routes/recruiter/collections';

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
    profile_photo_url?: string | null;
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

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

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
    const emailForm = useForm({
        subject: '',
        message: '',
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

    const assignCandidateToSubCollection = (candidateId: number, subCollectionId: number) => {
        router.post(`/recruiter/candidates/${candidateId}/collections`, {
            collection_id: subCollectionId,
        }, {
            preserveScroll: true,
        });
    };

    const removeCandidate = (candidateId: number, collectionId: number = collection.id) => {
        router.delete(`/recruiter/candidates/${candidateId}/collections/${collectionId}`, {
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

    const candidateRows = candidates.data.map((candidate) => {
        const assignedToCurrent = candidate.collections.some((item) => item.id === collection.id);
        const assignedViaChild = candidate.collections.some((item) => childIds.has(item.id));
        const assignedSubCollections = children.data.filter((child) =>
            candidate.collections.some((item) => item.id === child.id),
        );
        const availableSubCollections = children.data.filter((child) =>
            !candidate.collections.some((item) => item.id === child.id),
        );

        return {
            candidate,
            assignedToCurrent,
            assignedViaChild,
            assignedSubCollections,
            availableSubCollections,
        };
    });

    const selectableRows = candidateRows.filter((row) => !row.assignedToCurrent && row.assignedSubCollections.length === 0);
    const addedRows = candidateRows.filter((row) => row.assignedToCurrent || row.assignedSubCollections.length > 0);

    return (
        <RecruiterLayout
            title="Collection Workspace"
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={submitSearch}
        >
            <Head title={collection.name} />

            <section className="mb-6 rounded-3xl border border-border/70 bg-blue-700 p-6 text-white shadow-lg">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                            <FolderKanban className="size-3.5" />
                            Collection workspace
                        </div>
                        <h1 className="mt-3 text-2xl font-semibold">{collection.name}</h1>
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

            <section className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-foreground">Sub-collections</div>
                        <div className="text-xs text-muted-foreground">Create child collections and manage them directly here.</div>
                    </div>
                    <Button onClick={() => setCreateSubOpen(true)} className="rounded-xl">
                        <Plus className="size-4" />
                        Create sub-collection
                    </Button>
                </div>

                {children.data.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {children.data.map((child) => (
                            <div key={child.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{child.name}</div>
                                        <div className="text-xs text-muted-foreground">{child.description ?? 'No description'}</div>
                                        <div className="mt-2 text-xs text-muted-foreground">{child.candidates_count} candidates</div>
                                    </div>
                                    <Layers className="size-4 text-muted-foreground" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link
                                        href={show(child.id).url}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent/60"
                                    >
                                        View
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => openEditChild(child)}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent/60"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteChild(child)}
                                        className="rounded-lg border border-red-300/60 bg-red-500/10 px-3 py-1.5 text-xs text-red-700 hover:bg-red-500/20 dark:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                        No sub-collections yet.
                    </div>
                )}
            </section>

            <section className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="text-sm font-semibold text-foreground">Email this collection</div>
                    <p className="text-xs text-muted-foreground">
                        Sends to {collection.candidates_count} candidates in this collection.
                    </p>
                </div>
                <form
                    className="mt-4 grid gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        emailForm.post(sendCollectionEmail(collection.id).url, {
                            preserveScroll: true,
                            onSuccess: () => emailForm.reset(),
                        });
                    }}
                >
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="collection_email_subject">
                            Subject
                        </label>
                        <input
                            id="collection_email_subject"
                            value={emailForm.data.subject}
                            onChange={(event) => emailForm.setData('subject', event.target.value)}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            placeholder="Hiring update"
                        />
                        {emailForm.errors.subject && (
                            <p className="text-xs text-red-600">{emailForm.errors.subject}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="collection_email_message">
                            Message
                        </label>
                        <textarea
                            id="collection_email_message"
                            value={emailForm.data.message}
                            onChange={(event) => emailForm.setData('message', event.target.value)}
                            rows={5}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Share the role details, next steps, or interview information."
                        />
                        {emailForm.errors.message && (
                            <p className="text-xs text-red-600">{emailForm.errors.message}</p>
                        )}
                    </div>
                    <div className="flex items-center justify-end">
                        <Button type="submit" disabled={emailForm.processing}>
                            {emailForm.processing ? 'Sending...' : 'Send Email'}
                        </Button>
                    </div>
                </form>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            <UserCheck className="size-4" />
                            Candidate assignment
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Search candidates (including inherited parent candidates) and assign them to this collection.
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Page {candidates.meta.current_page} / {candidates.meta.last_page}</div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3 rounded-xl border border-border/70 bg-background/50 p-4">
                        <div className="text-sm font-semibold text-foreground">Selectable candidates</div>
                        {selectableRows.length > 0 ? selectableRows.map(({ candidate, availableSubCollections }) => (
                            <div key={`selectable-${candidate.id}`} className="rounded-xl border border-border/70 bg-card/70 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-border/70">
                                            <AvatarImage
                                                src={candidate.profile_photo_url ?? undefined}
                                                alt={candidate.name}
                                            />
                                            <AvatarFallback className="text-xs font-semibold">
                                                {initials(candidate.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">{candidate.name}</div>
                                            <div className="text-xs text-muted-foreground">{candidate.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={showCandidate(candidate.id).url}
                                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent/60"
                                        >
                                            View profile
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => assignCandidate(candidate.id)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20"
                                        >
                                            <Users className="size-3" />
                                            Add to this collection
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {candidate.skills.slice(0, 6).map((skill) => (
                                        <span key={`${candidate.id}-${skill}`} className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-700 dark:text-sky-300">
                                            {skill}
                                        </span>
                                    ))}
                                    {candidate.skills.length === 0 && (
                                        <span className="text-xs text-muted-foreground">No skills listed</span>
                                    )}
                                </div>
                                {children.data.length > 0 && (
                                    <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Add to sub-collection
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {availableSubCollections.length > 0 ? availableSubCollections.map((subCollection) => (
                                                <button
                                                    key={`add-sub-${candidate.id}-${subCollection.id}`}
                                                    type="button"
                                                    onClick={() => assignCandidateToSubCollection(candidate.id, subCollection.id)}
                                                    className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-primary hover:bg-primary/20"
                                                >
                                                    Add to {subCollection.name}
                                                </button>
                                            )) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Already added to all sub-collections.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                No selectable candidates for sub-collections.
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 rounded-xl border border-border/70 bg-background/50 p-4">
                        <div className="text-sm font-semibold text-foreground">Added candidates</div>
                        {addedRows.length > 0 ? addedRows.map(({ candidate, assignedSubCollections, assignedToCurrent }) => (
                            <div key={`added-${candidate.id}`} className="rounded-xl border border-border/70 bg-card/70 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-border/70">
                                            <AvatarImage
                                                src={candidate.profile_photo_url ?? undefined}
                                                alt={candidate.name}
                                            />
                                            <AvatarFallback className="text-xs font-semibold">
                                                {initials(candidate.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">{candidate.name}</div>
                                            <div className="text-xs text-muted-foreground">{candidate.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={showCandidate(candidate.id).url}
                                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent/60"
                                        >
                                            View profile
                                        </Link>
                                        {assignedToCurrent && (
                                            <button
                                                type="button"
                                                onClick={() => removeCandidate(candidate.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-red-300/60 bg-red-500/10 px-3 py-1.5 text-xs text-red-700 hover:bg-red-500/20 dark:text-red-300"
                                            >
                                                Remove from parent
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Added list
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {assignedSubCollections.map((subCollection) => (
                                            <button
                                                key={`remove-sub-${candidate.id}-${subCollection.id}`}
                                                type="button"
                                                onClick={() => removeCandidate(candidate.id, subCollection.id)}
                                                className="rounded-full border border-emerald-300/50 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                                            >
                                                {subCollection.name} ×
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                No candidates added to sub-collections yet.
                            </div>
                        )}
                    </div>
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
                            <Button type="submit" disabled={createSubForm.processing}>
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
                            <Button type="submit" disabled={editChildForm.processing}>
                                {editChildForm.processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </RecruiterLayout>
    );
}
