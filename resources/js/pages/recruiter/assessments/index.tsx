import { Head, Link, router } from '@inertiajs/react';
import { BarChart3, ClipboardList, Rocket } from 'lucide-react';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { analytics, create, destroy, show, toggleStatus } from '@/routes/recruiter/assessments';

type Assessment = {
    id: number;
    title: string;
    category: string;
    difficulty: string;
    is_active: boolean;
    questions_count: number;
    attempts_count: number;
    completed_attempts_count: number;
    status: 'active' | 'draft' | 'private' | string;
    created_at: string | null;
};

type Props = {
    assessments: {
        data: Assessment[];
    };
};

const statusPillClass = (status: string): string => {
    if (status === 'active') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200';
    }

    if (status === 'private') {
        return 'border-slate-300 bg-slate-200 text-slate-800 dark:border-slate-500/50 dark:bg-slate-500/10 dark:text-slate-200';
    }

    return 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200';
};

export default function RecruiterAssessmentsIndex({ assessments }: Props) {
    const totalAssessments = assessments.data.length;

    return (
        <RecruiterLayout title="Assessments">
            <Head title="Assessments" />

            <div className="space-y-5">
                <section className="rounded-3xl border border-sky-300/40 bg-sky-50 p-5 shadow-sm dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Assessment command center</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Build hiring tests, track participation, and deep dive into score analytics.
                            </p>
                        </div>
                        <Link
                            href={create().url}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                            <Rocket className="size-4" />
                            Create assessment
                        </Link>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border/50 bg-white/80 p-3 dark:bg-slate-950/60">
                            <p className="text-xs uppercase text-muted-foreground">Total tests</p>
                            <p className="mt-1 text-2xl font-semibold">{totalAssessments}</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-white/80 p-3 dark:bg-slate-950/60">
                            <p className="text-xs uppercase text-muted-foreground">Live tests</p>
                            <p className="mt-1 text-2xl font-semibold">
                                {assessments.data.filter((assessment) => assessment.status === 'active').length}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-white/80 p-3 dark:bg-slate-950/60">
                            <p className="text-xs uppercase text-muted-foreground">Private tests</p>
                            <p className="mt-1 text-2xl font-semibold">
                                {assessments.data.filter((assessment) => assessment.status === 'private').length}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                    {assessments.data.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                            No assessments yet. Create one and publish it to make it available for candidates.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border/70 text-muted-foreground">
                                        <th className="px-3 py-2 font-medium">Assessment</th>
                                        <th className="px-3 py-2 font-medium">Questions</th>
                                        <th className="px-3 py-2 font-medium">Attempts</th>
                                        <th className="px-3 py-2 font-medium">Status</th>
                                        <th className="px-3 py-2 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.data.map((assessment) => (
                                        <tr key={assessment.id} className="border-b border-border/60 last:border-b-0">
                                            <td className="px-3 py-3 align-top">
                                                <Link
                                                    href={show({ assessment: assessment.id }).url}
                                                    className="font-semibold text-primary hover:text-primary/80"
                                                >
                                                    {assessment.title}
                                                </Link>
                                                <p className="mt-0.5 text-xs text-muted-foreground">{assessment.category}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top">{assessment.questions_count}</td>
                                            <td className="px-3 py-3 align-top">
                                                <div>{assessment.attempts_count}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {assessment.completed_attempts_count} submitted
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusPillClass(assessment.status)}`}>
                                                    {assessment.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <select
                                                        value={assessment.status}
                                                        onChange={(event) =>
                                                            router.post(
                                                                toggleStatus({ assessment: assessment.id }).url,
                                                                { status: event.target.value },
                                                                { preserveScroll: true },
                                                            )
                                                        }
                                                        className="rounded-md border border-border/70 bg-background px-2 py-1 text-xs"
                                                    >
                                                        <option value="draft">Draft</option>
                                                        <option value="active">Active</option>
                                                        <option value="private">Private</option>
                                                    </select>
                                                    <Link
                                                        href={show({ assessment: assessment.id }).url}
                                                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                                                    >
                                                        <ClipboardList className="size-4" />
                                                        Manage
                                                    </Link>
                                                    <Link
                                                        href={analytics({ assessment: assessment.id }).url}
                                                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
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
                                                            });
                                                        }}
                                                        className="text-rose-600 hover:text-rose-500"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </RecruiterLayout>
    );
}
