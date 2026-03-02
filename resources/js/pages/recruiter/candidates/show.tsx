import { Head, router, useForm } from '@inertiajs/react';
import { Download, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/recruiter/status-badge';
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
import { destroy as destroyCandidate, update } from '@/routes/recruiter/candidates';
import { toggle } from '@/routes/recruiter/candidates/star';

type Candidate = {
    id: number;
    name: string;
    email: string;
    skills: string[];
    status: string;
    status_label: string;
    status_color: string;
    is_starred: boolean;
    location?: string;
    graduation_year?: string;
    university?: string;
    degree?: string;
    major?: string;
    achievements?: string | null;
    hackathons_experience?: string | null;
    projects_description?: string | null;
    education?: {
        is_currently_studying: boolean;
        current_semester: number | null;
        total_semesters: number | null;
        projected_semester: number | null;
        is_completed: boolean;
        status_label: string;
    } | null;
    latest_resume: {
        download_url: string;
    } | null;
    collections: Array<{ id: number; name: string }>;
};

type Comment = {
    id: number;
    body: string;
    recruiter: { name: string };
    created_at: string;
    update_url: string;
    delete_url: string;
    can_update: boolean;
    can_delete: boolean;
};

type Collection = {
    id: number;
    name: string;
    parent_name?: string | null;
};

type Props = {
    candidate: Candidate;
    comments: { data: Comment[] };
    collections: { data: Collection[] };
    statuses: Array<{ value: string; label: string }>;
};

export default function RecruiterCandidateShow({ candidate, comments, collections, statuses }: Props) {
    const { data, setData, put, processing, isDirty, reset } = useForm({
        status: candidate.status,
        comment: '',
        collections: (candidate.collections || []).map((c) => c.id),
    });

    const [commentOpen, setCommentOpen] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentBody, setEditingCommentBody] = useState('');

    const onToggleStar = () => {
        router.post(toggle(candidate.id).url, {}, { preserveScroll: true });
    };

    const toggleCollection = (collectionId: number) => {
        if (data.collections.includes(collectionId)) {
            setData('collections', data.collections.filter(id => id !== collectionId));
        } else {
            setData('collections', [...data.collections, collectionId]);
        }
    };

    const submitGlobalUpdate = () => {
        put(update(candidate.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                reset('comment');
                setCommentOpen(false);
            },
        });
    };

    const startCommentEdit = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentBody(comment.body);
    };

    const saveCommentEdit = (comment: Comment) => {
        router.put(
            comment.update_url,
            { body: editingCommentBody },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingCommentId(null);
                    setEditingCommentBody('');
                },
            },
        );
    };

    const deleteComment = (comment: Comment) => {
        if (!window.confirm('Delete this comment?')) {
            return;
        }

        router.delete(comment.delete_url, {
            preserveScroll: true,
        });
    };

    const deleteCandidateProfile = () => {
        if (!window.confirm('Delete this candidate? This action cannot be undone.')) {
            return;
        }

        router.delete(destroyCandidate(candidate.id).url);
    };

    return (
        <RecruiterLayout title="Candidate Details">
            <Head title={candidate.name} />

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">{candidate.name}</h2>
                                <p className="text-sm text-muted-foreground">{candidate.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onToggleStar}
                                className="rounded-full p-2 transition-colors hover:bg-amber-200/40 dark:hover:bg-amber-300/20"
                            >
                                <Star
                                    className={`size-4 ${candidate.is_starred
                                        ? 'fill-amber-400 text-amber-500'
                                        : 'text-muted-foreground'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="mt-4">
                            <StatusBadge status={candidate.status} label={candidate.status_label} color={candidate.status_color} />
                        </div>

                        {(candidate.location ||
                            candidate.university ||
                            candidate.degree ||
                            candidate.major ||
                            candidate.graduation_year ||
                            candidate.education) && (
                            <div className="mt-5 grid gap-4 rounded-xl border border-border/50 bg-muted/10 p-4 sm:grid-cols-2">
                                {candidate.location && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Location</div>
                                        <div className="mt-1 text-sm">{candidate.location}</div>
                                    </div>
                                )}
                                {candidate.university && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">University</div>
                                        <div className="mt-1 text-sm">{candidate.university}</div>
                                    </div>
                                )}
                                {candidate.degree && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Degree</div>
                                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-sm">
                                            <span>{candidate.degree}</span>
                                            {candidate.major && <span className="text-muted-foreground truncate max-w-[150px]">in {candidate.major}</span>}
                                        </div>
                                    </div>
                                )}
                                {candidate.graduation_year && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Graduation year</div>
                                        <div className="mt-1 text-sm">{candidate.graduation_year}</div>
                                    </div>
                                )}
                                {candidate.education && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Education status</div>
                                        <div className="mt-1 text-sm">{candidate.education.status_label}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {(candidate.achievements || candidate.hackathons_experience || candidate.projects_description) && (
                            <div className="mt-5 space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
                                {candidate.achievements && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Achievements</div>
                                        <p className="mt-1 text-sm whitespace-pre-wrap">{candidate.achievements}</p>
                                    </div>
                                )}
                                {candidate.hackathons_experience && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Hackathons experience</div>
                                        <p className="mt-1 text-sm whitespace-pre-wrap">{candidate.hackathons_experience}</p>
                                    </div>
                                )}
                                {candidate.projects_description && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Projects description</div>
                                        <p className="mt-1 text-sm whitespace-pre-wrap">{candidate.projects_description}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            {(candidate.skills || []).map((skill) => (
                                <span
                                    key={skill}
                                    className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {candidate.latest_resume && (
                            <a
                                href={candidate.latest_resume.download_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-muted/30"
                            >
                                <Download className="size-4" />
                                Download resume
                            </a>
                        )}
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
                        <div className="text-sm font-semibold">Update status</div>
                        <div className="mt-3 flex flex-col gap-3">
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            >
                                {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
                        <div className="text-sm font-semibold">Collections</div>
                        <select
                            value=""
                            onChange={(e) => toggleCollection(Number(e.target.value))}
                            className="mt-3 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Add to collection</option>
                            {collections.data.map((collection) => (
                                <option key={collection.id} value={collection.id}>
                                    {collection.name}
                                </option>
                            ))}
                        </select>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {collections.data.filter(c => data.collections.includes(c.id)).map((collection) => (
                                <button
                                    key={collection.id}
                                    type="button"
                                    onClick={() => toggleCollection(collection.id)}
                                    className="rounded-full border border-border/70 px-3 py-1 text-xs hover:bg-muted/40"
                                >
                                    {collection.parent_name ? `${collection.parent_name} > ${collection.name}` : collection.name} ×
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur lg:col-span-3">
                    <div className="mb-4 flex flex-col justify-between sm:flex-row sm:items-center">
                        <div className="text-sm font-semibold">Private comments</div>
                        <div className="mt-3 sm:mt-0 space-x-2">
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setCommentOpen(true)}>
                                <Plus className="size-4" />
                                Add comment
                            </Button>

                            <Button
                                size="sm"
                                className="rounded-xl"
                                onClick={submitGlobalUpdate}
                                disabled={!isDirty || processing}
                            >
                                {processing ? 'Saving...' : 'Save Global Changes'}
                            </Button>

                            <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-xl"
                                onClick={deleteCandidateProfile}
                            >
                                <Trash2 className="size-4" />
                                Delete candidate
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {comments.data.map((comment) => (
                            <div
                                key={comment.id}
                                className="rounded-xl border border-border/60 bg-muted/20 p-3"
                            >
                                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <div>
                                        {comment.recruiter.name} • {comment.created_at}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {comment.can_update && (
                                            <button
                                                type="button"
                                                onClick={() => startCommentEdit(comment)}
                                                className="font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {comment.can_delete && (
                                            <button
                                                type="button"
                                                onClick={() => deleteComment(comment)}
                                                className="font-medium text-red-600 hover:text-red-700"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {editingCommentId === comment.id ? (
                                    <div className="mt-2 space-y-2">
                                        <textarea
                                            value={editingCommentBody}
                                            onChange={(event) => setEditingCommentBody(event.target.value)}
                                            rows={4}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => saveCommentEdit(comment)}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingCommentId(null);
                                                    setEditingCommentBody('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-foreground">{comment.body}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add private comment</DialogTitle>
                        <DialogDescription>
                            Comments are visible to recruiters and super admins only.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        value={data.comment}
                        onChange={(e) => setData('comment', e.target.value)}
                        rows={5}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Draft a private comment for this candidate before saving..."
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setData('comment', '');
                            setCommentOpen(false);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={() => setCommentOpen(false)}>Add to Staged Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </RecruiterLayout>
    );
}
