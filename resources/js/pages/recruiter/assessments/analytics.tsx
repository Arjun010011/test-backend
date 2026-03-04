import { Head, Link } from '@inertiajs/react';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { show as showCandidateProfile } from '@/routes/recruiter/candidates';

type Props = {
    assessment: {
        id: number;
        title: string;
    };
    analytics: {
        overview: {
            total_attempts: number;
            unique_candidates: number;
            average_score: number;
            highest_score: number;
            lowest_score: number;
            median_score: number;
            pass_rate: number;
            average_time: number;
        };
        top_scorers: Array<{
            candidate_id: number;
            candidate_name: string;
            college: string;
            score: number;
            max_score: number;
            percentage: number;
            time_taken: string;
            risk_score: number;
            submitted_at: string | null;
        }>;
        score_distribution: Array<{
            range: string;
            count: number;
        }>;
        question_difficulty: Array<{
            question_id: number;
            question_text: string;
            category: string;
            difficulty: string;
            accuracy_rate: number;
            total_responses: number;
            correct_responses: number;
        }>;
        college_performance: Array<{
            college_name: string;
            total_attempts: number;
            average_score: number;
            highest_score: number;
            lowest_score: number;
        }>;
        time_analysis: {
            average_time: number;
            fastest_time: number;
            slowest_time: number;
            median_time: number;
            time_vs_score_correlation: number;
        };
        proctoring: {
            total_events: number;
            high_severity_events: number;
            medium_severity_events: number;
            low_severity_events: number;
            event_types: Array<{
                event_type: string;
                count: number;
            }>;
            flagged_candidates: Array<{
                candidate_id: number;
                candidate_name: string;
                risk_score: number;
                high_events: number;
                medium_events: number;
                low_events: number;
            }>;
            recent_events: Array<{
                candidate_name: string;
                event_type: string;
                severity: string;
                occurred_at: string | null;
                metadata: Record<string, unknown>;
            }>;
        };
    };
};

export default function RecruiterAssessmentsAnalytics({ assessment, analytics }: Props) {
    return (
        <RecruiterLayout title="Assessment Analytics">
            <Head title="Assessment Analytics" />

            <div className="space-y-5">
                <section className="rounded-3xl border border-indigo-300/40 bg-indigo-50 p-5 shadow-sm dark:bg-slate-900">
                    <h2 className="text-xl font-semibold tracking-tight">{assessment.title}</h2>
                    <p className="text-sm text-muted-foreground">Detailed performance analytics and live scoreboard.</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-xl border border-border/70 bg-white/80 p-4 dark:bg-slate-950/60">
                            <p className="text-xs uppercase text-muted-foreground">Attempts</p>
                            <p className="mt-1 text-2xl font-semibold">{analytics.overview.total_attempts}</p>
                        </article>
                        <article className="rounded-xl border border-border/70 bg-white/80 p-4 dark:bg-slate-950/60">
                            <p className="text-xs uppercase text-muted-foreground">Avg score</p>
                            <p className="mt-1 text-2xl font-semibold">{analytics.overview.average_score}%</p>
                        </article>
                        <article className="rounded-xl border border-border/70 bg-white/80 p-4 dark:bg-slate-950/60">
                            <p className="text-xs uppercase text-muted-foreground">Median</p>
                            <p className="mt-1 text-2xl font-semibold">{analytics.overview.median_score}%</p>
                        </article>
                        <article className="rounded-xl border border-border/70 bg-white/80 p-4 dark:bg-slate-950/60">
                            <p className="text-xs uppercase text-muted-foreground">Pass rate</p>
                            <p className="mt-1 text-2xl font-semibold">{analytics.overview.pass_rate}%</p>
                        </article>
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <article className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                        <h3 className="text-base font-semibold">Scoreboard</h3>
                        {analytics.top_scorers.length === 0 ? (
                            <p className="mt-2 text-sm text-muted-foreground">No submissions yet.</p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border/70 text-muted-foreground">
                                            <th className="px-2 py-2">Candidate</th>
                                            <th className="px-2 py-2">College</th>
                                            <th className="px-2 py-2">Score</th>
                                            <th className="px-2 py-2">Time</th>
                                            <th className="px-2 py-2">Risk (10)</th>
                                            <th className="px-2 py-2 text-right">Profile</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.top_scorers.map((scorer) => (
                                            <tr key={`${scorer.candidate_id}-${scorer.submitted_at}`} className="border-b border-border/50 last:border-b-0">
                                                <td className="px-2 py-2 font-medium">{scorer.candidate_name}</td>
                                                <td className="px-2 py-2">{scorer.college}</td>
                                                <td className="px-2 py-2">{scorer.score}/{scorer.max_score} ({scorer.percentage}%)</td>
                                                <td className="px-2 py-2">{scorer.time_taken}</td>
                                                <td className="px-2 py-2">{scorer.risk_score}/10</td>
                                                <td className="px-2 py-2 text-right">
                                                    <Link
                                                        href={showCandidateProfile(scorer.candidate_id).url}
                                                        className="text-sm font-medium text-primary hover:text-primary/80"
                                                    >
                                                        View profile
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </article>

                    <article className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                        <h3 className="text-base font-semibold">Score distribution</h3>
                        <div className="mt-3 space-y-3">
                            {analytics.score_distribution.map((bucket) => {
                                const maxBucketCount = Math.max(
                                    1,
                                    ...analytics.score_distribution.map((distribution) => distribution.count),
                                );
                                const width = (bucket.count / maxBucketCount) * 100;

                                return (
                                    <div key={bucket.range} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{bucket.range}%</span>
                                            <span>{bucket.count}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${width}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </article>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <article className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                        <h3 className="text-base font-semibold">Question difficulty analysis</h3>
                        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
                            {analytics.question_difficulty.slice(0, 15).map((question) => (
                                <div key={question.question_id} className="rounded-lg border border-border/60 p-3">
                                    <p className="text-sm font-medium">{question.question_text}</p>
                                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full border border-border/60 px-2 py-0.5">{question.category}</span>
                                        <span className="rounded-full border border-border/60 px-2 py-0.5 capitalize">
                                            {question.difficulty}
                                        </span>
                                        <span className="rounded-full border border-border/60 px-2 py-0.5">
                                            Accuracy: {question.accuracy_rate}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                        <h3 className="text-base font-semibold">College performance</h3>
                        {analytics.college_performance.length === 0 ? (
                            <p className="mt-2 text-sm text-muted-foreground">No college-level data yet.</p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border/70 text-muted-foreground">
                                            <th className="px-2 py-2">College</th>
                                            <th className="px-2 py-2">Attempts</th>
                                            <th className="px-2 py-2">Avg</th>
                                            <th className="px-2 py-2">Best</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.college_performance.map((college) => (
                                            <tr key={college.college_name} className="border-b border-border/50 last:border-b-0">
                                                <td className="px-2 py-2 font-medium">{college.college_name}</td>
                                                <td className="px-2 py-2">{college.total_attempts}</td>
                                                <td className="px-2 py-2">{college.average_score}%</td>
                                                <td className="px-2 py-2">{college.highest_score}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-lg border border-border/60 p-3">
                                <p className="text-xs text-muted-foreground">Avg completion time</p>
                                <p className="text-lg font-semibold">{analytics.time_analysis.average_time} min</p>
                            </div>
                            <div className="rounded-lg border border-border/60 p-3">
                                <p className="text-xs text-muted-foreground">Time vs score correlation</p>
                                <p className="text-lg font-semibold">{analytics.time_analysis.time_vs_score_correlation}</p>
                            </div>
                        </div>
                    </article>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <article className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                        <h3 className="text-base font-semibold">Proctoring risk summary</h3>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-border/60 p-3 text-sm">
                                <p className="text-xs text-muted-foreground">Total events</p>
                                <p className="text-lg font-semibold">{analytics.proctoring.total_events}</p>
                            </div>
                            <div className="rounded-lg border border-rose-300/60 bg-rose-50/70 p-3 text-sm dark:border-rose-500/50 dark:bg-rose-500/10">
                                <p className="text-xs text-rose-700 dark:text-rose-200">High severity</p>
                                <p className="text-lg font-semibold text-rose-800 dark:text-rose-100">
                                    {analytics.proctoring.high_severity_events}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                            {analytics.proctoring.event_types.slice(0, 8).map((eventType) => (
                                <div key={eventType.event_type} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                                    <span className="capitalize">{eventType.event_type.replaceAll('_', ' ')}</span>
                                    <span className="font-semibold">{eventType.count}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                        <h3 className="text-base font-semibold">Flagged candidates</h3>
                        {analytics.proctoring.flagged_candidates.length === 0 ? (
                            <p className="mt-2 text-sm text-muted-foreground">No proctoring violations logged.</p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border/70 text-muted-foreground">
                                            <th className="px-2 py-2">Candidate</th>
                                            <th className="px-2 py-2">Risk score</th>
                                            <th className="px-2 py-2">High</th>
                                            <th className="px-2 py-2">Medium</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.proctoring.flagged_candidates.map((candidate) => (
                                            <tr key={candidate.candidate_id} className="border-b border-border/50 last:border-b-0">
                                                <td className="px-2 py-2 font-medium">{candidate.candidate_name}</td>
                                                <td className="px-2 py-2">{candidate.risk_score}</td>
                                                <td className="px-2 py-2">{candidate.high_events}</td>
                                                <td className="px-2 py-2">{candidate.medium_events}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </article>
                </section>
            </div>
        </RecruiterLayout>
    );
}
