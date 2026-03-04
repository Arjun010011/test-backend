import { Head, Link, router } from '@inertiajs/react';
import { Award, Clock3, Layers3, PlayCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { index, result, start, take } from '@/routes/candidate/assessments';

type Attempt = {
    id: number;
    status: 'in_progress' | 'submitted' | 'expired' | 'abandoned';
    percentage: string | number | null;
    score: number;
    max_score: number;
    submitted_at: string | null;
};

type Props = {
    assessment: {
        id: number;
        title: string;
        description: string | null;
        duration_minutes: number;
        total_questions: number;
        passing_score: number | null;
    };
    assignment: {
        starts_at: string | null;
        ends_at: string | null;
        max_attempts: number;
    } | null;
    attempts: Attempt[];
    can_attempt: boolean;
    max_attempts: number;
    state: 'active' | 'upcoming' | 'completed' | 'inactive' | string;
};

export default function CandidateAssessmentsShow({
    assessment,
    assignment,
    attempts,
    can_attempt,
    max_attempts,
    state,
}: Props) {
    const formatAttemptStatus = (status: Attempt['status']): string => {
        if (status === 'submitted') {
            return 'completed';
        }

        return status.replace('_', ' ');
    };

    const formatSubmittedDate = (value: string | null): string => {
        if (value === null) {
            return '-';
        }

        const parsedDate = new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            return '-';
        }

        return new Intl.DateTimeFormat('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
        }).format(parsedDate);
    };

    const activeAttempt = attempts.find((attempt) => attempt.status === 'in_progress');
    const latestSubmittedAttempt = attempts.find((attempt) => attempt.status === 'submitted');

    return (
        <AppLayout fullWidth>
            <Head title={assessment.title} />

            <div className="w-full space-y-5 px-3 py-4 sm:px-4">
                <section className="rounded-3xl border border-blue-500 bg-blue-700 p-5 text-white shadow-sm">
                    <h2 className="text-2xl font-semibold tracking-tight">{assessment.title}</h2>
                    <p className="mt-1 text-sm text-blue-100">
                        {assessment.description ?? 'Complete the test before the timer runs out.'}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-blue-400 bg-blue-600 p-3 text-sm">
                            <p className="text-xs uppercase text-blue-100">Duration</p>
                            <p className="mt-1 inline-flex items-center gap-1 font-semibold">
                                <Clock3 className="size-4 text-cyan-200" />
                                {assessment.duration_minutes} minutes
                            </p>
                        </div>
                        <div className="rounded-xl border border-blue-400 bg-blue-600 p-3 text-sm">
                            <p className="text-xs uppercase text-blue-100">Questions</p>
                            <p className="mt-1 inline-flex items-center gap-1 font-semibold">
                                <Layers3 className="size-4 text-indigo-200" />
                                {assessment.total_questions}
                            </p>
                        </div>
                        <div className="rounded-xl border border-blue-400 bg-blue-600 p-3 text-sm">
                            <p className="text-xs uppercase text-blue-100">Passing score</p>
                            <p className="mt-1 inline-flex items-center gap-1 font-semibold">
                                <Award className="size-4 text-emerald-200" />
                                {assessment.passing_score ?? 0}%
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100">
                        <span className="rounded-full border border-blue-400 bg-blue-600 px-2 py-1">
                            State: {state}
                        </span>
                        <span className="rounded-full border border-blue-400 bg-blue-600 px-2 py-1">
                            Attempts used: {attempts.length}/{max_attempts}
                        </span>
                        {assignment?.ends_at && (
                            <span className="rounded-full border border-blue-400 bg-blue-600 px-2 py-1">
                                Ends: {assignment.ends_at}
                            </span>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        {activeAttempt ? (
                            <button
                                type="button"
                                onClick={() => router.visit(take({ assessment: assessment.id }).url)}
                                className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                <PlayCircle className="size-4" />
                                Resume Attempt
                            </button>
                        ) : can_attempt ? (
                            <button
                                type="button"
                                onClick={() => router.post(start({ assessment: assessment.id }).url)}
                                className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                <PlayCircle className="size-4" />
                                Start Test
                            </button>
                        ) : (
                            <span className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                This test is completed or no longer available.
                            </span>
                        )}

                        {latestSubmittedAttempt && (
                            <Link
                                href={result({ assessment: assessment.id }).url}
                                className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-accent/50"
                            >
                                View Latest Result
                            </Link>
                        )}

                        <Link
                            href={index().url}
                            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-accent/50"
                        >
                            Back to Assessments
                        </Link>
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <h3 className="text-base font-semibold">Attempt history</h3>
                    {attempts.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">No attempts yet.</p>
                    ) : (
                        <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border/70 text-muted-foreground">
                                        <th className="px-2 py-2">Attempt</th>
                                        <th className="px-2 py-2">Status</th>
                                        <th className="px-2 py-2">Score</th>
                                        <th className="px-2 py-2">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((attempt, index) => (
                                        <tr key={attempt.id} className="border-b border-border/50 last:border-b-0">
                                            <td className="px-2 py-2">#{attempts.length - index}</td>
                                            <td className="px-2 py-2 capitalize">{formatAttemptStatus(attempt.status)}</td>
                                            <td className="px-2 py-2">
                                                {attempt.status === 'submitted'
                                                    ? `${attempt.score}/${attempt.max_score} (${attempt.percentage ?? 0}%)`
                                                    : '-'}
                                            </td>
                                            <td className="px-2 py-2">{formatSubmittedDate(attempt.submitted_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
