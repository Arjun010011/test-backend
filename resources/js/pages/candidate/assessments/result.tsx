import { Head, Link } from '@inertiajs/react';
import { Award, CheckCircle2, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { index, show } from '@/routes/candidate/assessments';

type Props = {
    assessment: {
        id: number;
        title: string;
        passing_score: number | null;
    };
    attempt: {
        score: number;
        max_score: number;
        percentage: number;
        time_taken_seconds: number | null;
        submitted_at: string | null;
    };
    passed: boolean | null;
};

export default function CandidateAssessmentsResult({ assessment, attempt, passed }: Props) {
    const safeTimeTakenSeconds = attempt.time_taken_seconds === null ? null : Math.max(0, attempt.time_taken_seconds);
    const timeTakenMinutes = safeTimeTakenSeconds !== null ? (safeTimeTakenSeconds / 60).toFixed(1) : '-';

    return (
        <AppLayout fullWidth>
            <Head title={`${assessment.title} Result`} />

            <div className="w-full space-y-5 px-3 py-4 sm:px-4">
                <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                    <h2 className="text-2xl font-semibold tracking-tight">Assessment Result</h2>
                    <p className="text-sm text-muted-foreground">{assessment.title}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {passed === null ? (
                            <span className="rounded-full border border-slate-300 bg-slate-200 px-3 py-1 text-sm font-medium text-slate-900 dark:border-slate-500/50 dark:bg-slate-500/10 dark:text-slate-200">
                                Not evaluated
                            </span>
                        ) : passed ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200">
                                <CheckCircle2 className="size-4" /> Passed
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-sm font-medium text-rose-900 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200">
                                <XCircle className="size-4" /> Not Passed
                            </span>
                        )}
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Score</p>
                        <p className="mt-1 text-2xl font-semibold">{attempt.score} / {attempt.max_score}</p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Percentage</p>
                        <p className="mt-1 text-2xl font-semibold">{attempt.percentage}%</p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Time taken</p>
                        <p className="mt-1 text-2xl font-semibold">{timeTakenMinutes} min</p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs uppercase text-muted-foreground">Passing threshold</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-2xl font-semibold">
                            <Award className="size-5 text-amber-600" />
                            {assessment.passing_score ?? 0}%
                        </p>
                    </article>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={show({ assessment: assessment.id }).url}
                            className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                            Back to Assessment
                        </Link>
                        <Link
                            href={index().url}
                            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-accent/50"
                        >
                            All Assessments
                        </Link>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
