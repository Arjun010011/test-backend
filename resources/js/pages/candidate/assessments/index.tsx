import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, CircleAlert, CircleCheck, PlayCircle, Timer } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { show } from '@/routes/candidate/assessments';

type AssessmentListItem = {
    assessment: {
        id: number;
        title: string;
        description: string | null;
        category: string;
        difficulty: string;
        duration_minutes: number;
        total_questions: number;
        passing_score: number | null;
    };
    assignment: {
        id: number;
        college_name: string;
        starts_at: string | null;
        ends_at: string | null;
        max_attempts: number;
    } | null;
    attempts_taken: number;
    max_attempts: number;
    can_attempt: boolean;
    state: 'active' | 'upcoming' | 'completed' | 'inactive' | string;
};

type Props = {
    assessments: AssessmentListItem[];
    college: string | null;
    message?: string | null;
};

type SharedProps = {
    flash?: {
        status?: string | null;
    };
};

const stateBadgeClass = (state: string): string => {
    if (state === 'active') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200';
    }

    if (state === 'upcoming') {
        return 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200';
    }

    if (state === 'completed') {
        return 'border-slate-300 bg-slate-200 text-slate-800 dark:border-slate-500/50 dark:bg-slate-500/10 dark:text-slate-200';
    }

    return 'border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200';
};

export default function CandidateAssessmentsIndex({ assessments, college, message }: Props) {
    const { flash } = usePage<SharedProps>().props;
    const status = flash?.status ?? null;

    return (
        <AppLayout fullWidth>
            <Head title="Assessments" />

            <div className="w-full space-y-5 px-3 py-4 sm:px-4">
                {status === 'assessment-no-longer-available' && (
                    <section className="rounded-xl border border-amber-300/70 bg-amber-100/80 p-4 text-sm text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200">
                        <p className="inline-flex items-center gap-2 font-medium">
                            <CircleAlert className="size-4" />
                            This assessment is no longer available.
                        </p>
                        <p className="mt-1 text-xs">
                            It may have been set to private, unpublished, or moved outside its assignment window.
                        </p>
                    </section>
                )}

                <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                    <h2 className="text-xl font-semibold tracking-tight">Your assessments</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Practice environment with timer, instant scoring, and recruiter-defined difficulty mix.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-border/70 bg-background px-2 py-1">
                            College: {college ?? 'Not set'}
                        </span>
                        <span className="rounded-full border border-border/70 bg-background px-2 py-1">
                            Available tests: {assessments.length}
                        </span>
                    </div>
                    {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
                </section>

                {assessments.length === 0 ? (
                    <section className="rounded-xl border border-dashed border-border/70 bg-card p-5 text-sm text-muted-foreground">
                        No assessments available right now. Check back later.
                    </section>
                ) : (
                    <section className="grid gap-4 lg:grid-cols-2">
                        {assessments.map((item) => (
                            <article
                                key={item.assessment.id}
                                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-base font-semibold">{item.assessment.title}</h3>
                                        <p className="text-xs text-muted-foreground">{item.assessment.category}</p>
                                    </div>
                                    <span className={`rounded-full border px-2 py-1 text-xs font-medium ${stateBadgeClass(item.state)}`}>
                                        {item.state}
                                    </span>
                                </div>

                                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                    <p className="inline-flex items-center gap-1">
                                        <Timer className="size-4 text-cyan-600" />
                                        {item.assessment.duration_minutes} minutes
                                    </p>
                                    <p className="inline-flex items-center gap-1">
                                        <CircleCheck className="size-4 text-emerald-600" />
                                        {item.assessment.total_questions} questions
                                    </p>
                                    <p className="inline-flex items-center gap-1">
                                        <PlayCircle className="size-4 text-indigo-600" />
                                        Attempts: {item.attempts_taken}/{item.max_attempts}
                                    </p>
                                    <p className="inline-flex items-center gap-1">
                                        <CalendarClock className="size-4 text-amber-600" />
                                        Ends: {item.assignment?.ends_at ?? 'No deadline'}
                                    </p>
                                </div>

                                {item.assessment.description && (
                                    <p className="mt-3 text-sm text-muted-foreground">{item.assessment.description}</p>
                                )}

                                <div className="mt-4">
                                    <Link
                                        href={show({ assessment: item.assessment.id }).url}
                                        className="inline-flex items-center gap-1 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                                    >
                                        Open Test
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
