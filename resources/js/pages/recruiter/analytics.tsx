import { Head } from '@inertiajs/react';
import { BarChart3, BriefcaseBusiness, Building2, FolderKanban, Star, Users } from 'lucide-react';
import RecruiterLayout from '@/layouts/recruiter-layout';

type Props = {
    summary: {
        total_candidates: number;
        starred_candidates: number;
        active_collections: number;
        companies: number;
        active_companies: number;
        applications: number;
    };
    breakdown: {
        applications_by_status: Array<{
            status: string;
            total: number;
        }>;
        top_companies: Array<{
            id: number;
            name: string;
            applications_count: number;
        }>;
        application_trend: Array<{
            month: string;
            total: number;
        }>;
    };
};

const summaryCards = [
    { key: 'total_candidates', label: 'Candidates', icon: Users, tone: 'from-sky-500/20 to-sky-200/40' },
    { key: 'starred_candidates', label: 'Starred', icon: Star, tone: 'from-amber-500/20 to-amber-200/40' },
    { key: 'active_collections', label: 'Collections', icon: FolderKanban, tone: 'from-emerald-500/20 to-emerald-200/40' },
    { key: 'companies', label: 'Companies', icon: Building2, tone: 'from-indigo-500/20 to-indigo-200/40' },
    { key: 'active_companies', label: 'Active Companies', icon: BriefcaseBusiness, tone: 'from-cyan-500/20 to-cyan-200/40' },
    { key: 'applications', label: 'Applications', icon: BarChart3, tone: 'from-fuchsia-500/20 to-fuchsia-200/40' },
] as const;

export default function RecruiterAnalytics({ summary, breakdown }: Props) {
    const maxTrendCount = Math.max(...breakdown.application_trend.map((item) => item.total), 1);
    const maxStatusCount = Math.max(...breakdown.applications_by_status.map((item) => item.total), 1);

    return (
        <RecruiterLayout title="Analytics">
            <Head title="Recruiter Analytics" />

            <section className="rounded-2xl border border-sky-300/40 bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-indigo-500/15 px-4 py-3 text-sm text-foreground">
                Basic hiring analytics for candidate activity, company engagement, and application flow.
            </section>

            <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summaryCards.map((card) => (
                    <article
                        key={card.key}
                        className={`rounded-2xl border border-border/70 bg-gradient-to-br p-5 shadow-sm ${card.tone}`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground/80">{card.label}</p>
                            <card.icon className="size-4 text-foreground/80" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold">{summary[card.key]}</p>
                    </article>
                ))}
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-3">
                <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm xl:col-span-2">
                    <h2 className="text-base font-semibold">Applications Trend (6 months)</h2>
                    <div className="mt-4 space-y-3">
                        {breakdown.application_trend.map((item) => (
                            <div key={item.month}>
                                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                    <span>{item.month}</span>
                                    <span>{item.total}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted/60">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                                        style={{ width: `${Math.max((item.total / maxTrendCount) * 100, 4)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h2 className="text-base font-semibold">Top Companies</h2>
                    <div className="mt-4 space-y-3">
                        {breakdown.top_companies.length === 0 && (
                            <p className="text-sm text-muted-foreground">No company application data yet.</p>
                        )}
                        {breakdown.top_companies.map((company) => (
                            <div key={company.id} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                                <div className="text-sm font-medium">{company.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {company.applications_count} applications
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="mt-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                <h2 className="text-base font-semibold">Applications by Status</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {breakdown.applications_by_status.length === 0 && (
                        <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
                    )}
                    {breakdown.applications_by_status.map((entry) => (
                        <div key={entry.status} className="rounded-xl border border-border/60 bg-background/60 p-3">
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="capitalize">{entry.status}</span>
                                <span>{entry.total}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted/60">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                    style={{ width: `${Math.max((entry.total / maxStatusCount) * 100, 4)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </RecruiterLayout>
    );
}
