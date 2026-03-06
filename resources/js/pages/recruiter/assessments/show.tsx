import { Head, Link, router } from '@inertiajs/react';
import { BarChart3, Timer } from 'lucide-react';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { analytics, destroy, index, toggleStatus } from '@/routes/recruiter/assessments';

type Props = {
    assessment: {
        id: number;
        title: string;
        description: string | null;
        category: string;
        difficulty: string;
        duration_minutes: number;
        total_questions: number;
        passing_score: number | null;
        status: 'draft' | 'active' | 'private' | string;
    };
    analytics: {
        total_attempts: number;
        completed_attempts: number;
        average_score: number;
        pass_rate: number;
    };
};

export default function RecruiterAssessmentsShow({ assessment, analytics: stats }: Props) {
    return (
        <RecruiterLayout title={assessment.title}>
            <Head title={assessment.title} />

            <div className="space-y-5">
                <section className="rounded-3xl border border-cyan-300/40 bg-cyan-50 p-5 shadow-sm dark:bg-slate-900">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">{assessment.title}</h2>
                            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                                {assessment.description ?? 'No instructions provided for this assessment.'}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded-full border border-slate-300 bg-white/80 px-2 py-1 dark:bg-slate-950/60">
                                    {assessment.category}
                                </span>
                                <span className="rounded-full border border-slate-300 bg-white/80 px-2 py-1 capitalize dark:bg-slate-950/60">
                                    {assessment.difficulty}
                                </span>
                                <span className="rounded-full border border-slate-300 bg-white/80 px-2 py-1 dark:bg-slate-950/60">
                                    {assessment.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={assessment.status}
                                onChange={(event) =>
                                    router.post(
                                        toggleStatus({ assessment: assessment.id }).url,
                                        { status: event.target.value },
                                        { preserveScroll: true },
                                    )
                                }
                                className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold"
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="private">Private</option>
                            </select>
                            <Link
                                href={analytics({ assessment: assessment.id }).url}
                                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-accent/50"
                            >
                                <BarChart3 className="size-4" />
                                Analytics
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!window.confirm('Delete this assessment permanently?')) {
                                        return;
                                    }

                                    router.delete(destroy({ assessment: assessment.id }).url, {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            router.visit(index().url);
                                        },
                                    });
                                }}
                                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-200 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Questions</p>
                        <p className="mt-1 text-2xl font-semibold">{assessment.total_questions}</p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Duration</p>
                        <p className="mt-1 flex items-center gap-1 text-2xl font-semibold">
                            <Timer className="size-5 text-cyan-600" />
                            {assessment.duration_minutes}m
                        </p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Attempts</p>
                        <p className="mt-1 text-2xl font-semibold">{stats.total_attempts}</p>
                        <p className="text-xs text-muted-foreground">{stats.completed_attempts} submitted</p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Performance</p>
                        <p className="mt-1 text-2xl font-semibold">{stats.average_score}%</p>
                        <p className="text-xs text-muted-foreground">Pass rate: {stats.pass_rate}%</p>
                    </article>
                </section>

            </div>
        </RecruiterLayout>
    );
}
