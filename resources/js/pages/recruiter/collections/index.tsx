import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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
        parent_id: '',
    });
    const editForm = useForm({
        name: '',
        description: '',
        parent_id: '',
    });
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const collectionMap = new Map(collections.data.map((collection) => [collection.id, collection]));

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
            parent_id: collection.parent_id ? String(collection.parent_id) : '',
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

    const collectionDepth = (collection: Collection): number => {
        let depth = 0;
        let parentId = collection.parent_id;
        const visited = new Set<number>();

        while (parentId !== null && !visited.has(parentId)) {
            visited.add(parentId);
            const parent = collectionMap.get(parentId);

            if (parent === undefined) {
                break;
            }

            depth += 1;
            parentId = parent.parent_id;
        }

        return depth;
    };

    return (
        <RecruiterLayout title="Collections">
            <Head title="Collections" />

            <div className="space-y-4">
                <section className="rounded-3xl border border-blue-200/70 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-xl">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Recruiter</div>
                    <h1 className="mt-2 text-2xl font-bold">Collection Studio</h1>
                    <p className="mt-1 text-sm text-blue-100">
                        Organize candidates with nested collections and share clearer hiring pipelines.
                    </p>
                </section>

                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
                >
                    <div className="grid gap-3 md:grid-cols-4">
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
                        <select
                            value={form.data.parent_id}
                            onChange={(event) => form.setData('parent_id', event.target.value)}
                            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            <option value="">No parent (top-level)</option>
                            {collections.data.map((collection) => (
                                <option key={collection.id} value={collection.id}>
                                    {collection.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm text-white hover:bg-blue-800"
                        >
                            <Plus className="size-4" />
                            Create collection
                        </button>
                    </div>
                </form>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {collections.data.map((collection) => (
                        <div
                            key={collection.id}
                            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
                            style={{ marginLeft: `${collectionDepth(collection) * 12}px` }}
                        >
                            <div className="text-base font-semibold">{collection.name}</div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {collection.description ?? 'No description'}
                            </p>
                            {collection.parent_name && (
                                <div className="mt-1 text-xs text-slate-500">
                                    Parent: {collection.parent_name}
                                </div>
                            )}
                            <div className="mt-4 text-sm text-slate-600">
                                {collection.candidates_count} candidates
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                Created {collection.created_at}
                            </div>
                            <Link
                                href={show(collection.id).url}
                                className="mt-4 inline-flex rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-muted/30"
                            >
                                View
                            </Link>
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEdit(collection)}
                                    className="inline-flex rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-muted/30"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteCollection(collection)}
                                    className="inline-flex rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
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
                        <select
                            value={editForm.data.parent_id}
                            onChange={(event) => editForm.setData('parent_id', event.target.value)}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            <option value="">No parent (top-level)</option>
                            {collections.data
                                .filter((collection) => collection.id !== editingCollection?.id)
                                .map((collection) => (
                                    <option key={collection.id} value={collection.id}>
                                        {collection.name}
                                    </option>
                                ))}
                        </select>
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
