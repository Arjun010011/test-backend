import { Head, Link, router, useForm } from '@inertiajs/react';
import { FolderKanban, Layers3, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
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
import { show, store } from '@/routes/recruiter/collections';

type Collection = {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    parent_name: string | null;
    candidates_count: number;
    created_at: string;
    update_url: string;
    delete_url: string;
};

type Props = {
    collections: { data: Collection[] };
};

export default function RecruiterCollectionsIndex({ collections }: Props) {
    const form = useForm({
        name: '',
        description: '',
        parent_id: '' as string,
    });
    const editForm = useForm({
        name: '',
        description: '',
        parent_id: '' as string,
    });
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const openEdit = (collection: Collection) => {
        setEditingCollection(collection);
        editForm.setData({
            name: collection.name,
            description: collection.description ?? '',
            parent_id: '',
        });
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingCollection === null) {
            return;
        }

        editForm.put(editingCollection.update_url, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCollection(null);
            },
        });
    };

    const deleteCollection = (collection: Collection) => {
        if (!window.confirm(`Delete collection "${collection.name}"?`)) {
            return;
        }

        router.delete(collection.delete_url, {
            preserveScroll: true,
        });
    };

    const totalCollections = collections.data.length;
    const totalCandidates = collections.data.reduce(
        (carry, collection) => carry + collection.candidates_count,
        0,
    );
    const rootCollections = collections.data.filter(
        (collection) => collection.parent_id === null,
    ).length;

    return (
        <RecruiterLayout title="Collections">
            <Head title="Collections" />

            <div className="space-y-4">
                <section className="rounded-3xl border border-border/70 bg-blue-700 p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                                <FolderKanban className="size-3.5" />
                                Collection studio
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
                                Organize your hiring pipelines
                            </h1>
                            <p className="mt-2 text-sm text-blue-100">
                                Group candidates with parent and sub-collections so every role has a clear flow.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <p className="text-xs text-blue-100">Collections</p>
                                <p className="mt-1 text-xl font-semibold">{totalCollections}</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <p className="text-xs text-blue-100">Candidates tagged</p>
                                <p className="mt-1 text-xl font-semibold">{totalCandidates}</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <p className="text-xs text-blue-100">Root collections</p>
                                <p className="mt-1 text-xl font-semibold">{rootCollections}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm"
                >
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-foreground">Create collection</h2>
                        <p className="text-sm text-muted-foreground">
                            Start with a clear collection name and optional description.
                        </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <input
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="Collection name"
                            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <input
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            placeholder="Description"
                            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <input type="hidden" name="parent_id" value={form.data.parent_id} />
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm text-white hover:bg-blue-800"
                        >
                            <Plus className="size-4" />
                            Create collection
                        </button>
                    </div>
                </form>

                {collections.data.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-border/70 bg-card/70 px-6 py-12 text-center">
                        <Layers3 className="mx-auto size-8 text-muted-foreground" />
                        <h3 className="mt-3 text-lg font-semibold">No collections yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create your first collection to begin organizing candidates.
                        </p>
                    </section>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {collections.data.map((collection) => (
                        <article
                            key={collection.id}
                            className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-base font-semibold">{collection.name}</div>
                                    {collection.parent_name && (
                                        <div className="mt-1 inline-flex items-center rounded-full border border-border bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                                            Child of {collection.parent_name}
                                        </div>
                                    )}
                                </div>
                                <FolderKanban className="size-4 text-muted-foreground" />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {collection.description ?? 'No description'}
                            </p>
                            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <Users className="size-3.5" />
                                    {collection.candidates_count} candidates
                                </span>
                                <span>Created {collection.created_at}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                    href={show(collection.id).url}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-muted/30"
                                >
                                    View workspace
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => openEdit(collection)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-muted/30"
                                >
                                    <Pencil className="size-3.5" />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteCollection(collection)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-300/60 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"
                                >
                                    <Trash2 className="size-3.5" />
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            <Dialog
                open={editingCollection !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingCollection(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit collection</DialogTitle>
                        <DialogDescription>
                            Update name and description for this collection.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-3">
                        <input
                            value={editForm.data.name}
                            onChange={(event) => editForm.setData('name', event.target.value)}
                            placeholder="Collection name"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <input
                            value={editForm.data.description}
                            onChange={(event) => editForm.setData('description', event.target.value)}
                            placeholder="Description"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <input type="hidden" name="parent_id" value={editForm.data.parent_id} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingCollection(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </RecruiterLayout>
    );
}
