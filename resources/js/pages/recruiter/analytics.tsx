import { Head } from '@inertiajs/react';
import {
    BarChart3,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    FolderKanban,
    Sparkles,
    Star,
    TrendingUp,
    Users,
} from 'lucide-react';
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
    {
        key: 'total_candidates',
        label: 'Candidates',
        icon: Users,
        tone: 'bg-sky-100/80 dark:bg-sky-900/30',
    },
    {
        key: 'starred_candidates',
        label: 'Starred',
        icon: Star,
        tone: 'bg-amber-100/80 dark:bg-amber-900/30',
    },
    {
        key: 'active_collections',
        label: 'Collections',
        icon: FolderKanban,
        tone: 'bg-violet-100/80 dark:bg-violet-900/30',
    },
    {
        key: 'companies',
        label: 'Companies',
        icon: Building2,
        tone: 'bg-cyan-100/80 dark:bg-cyan-900/30',
    },
    {
        key: 'active_companies',
        label: 'Active Companies',
        icon: BriefcaseBusiness,
        tone: 'bg-emerald-100/80 dark:bg-emerald-900/30',
    },
    {
        key: 'applications',
        label: 'Applications',
        icon: BarChart3,
        tone: 'bg-blue-100/80 dark:bg-blue-900/30',
    },
] as const;

export default function RecruiterAnalytics({ summary, breakdown }: Props) {
    const maxTrendCount = Math.max(...breakdown.application_trend.map((item) => item.total), 1);
    const maxStatusCount = Math.max(...breakdown.applications_by_status.map((item) => item.total), 1);
    const totalTrendApplications = breakdown.application_trend.reduce(
        (carry, item) => carry + item.total,
        0,
    );
    const bestTrendMonth = breakdown.application_trend.reduce(
        (best, item) => (item.total > best.total ? item : best),
        breakdown.application_trend[0] ?? { month: 'N/A', total: 0 },
    );
    const candidateToApplicationRatio = summary.total_candidates === 0
        ? 0
        : Math.round((summary.applications / summary.total_candidates) * 100);
    const activeCompanyRatio = summary.companies === 0
        ? 0
        : Math.round((summary.active_companies / summary.companies) * 100);
    const starredRatio = summary.total_candidates === 0
        ? 0
        : Math.round((summary.starred_candidates / summary.total_candidates) * 100);

    return (
        <RecruiterLayout title="Analytics">
            <Head title="Recruiter Analytics" />

            <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-blue-700 p-6 text-white shadow-lg">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-cyan-200/20 blur-2xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                            <Sparkles className="size-3.5" />
                            Recruiter performance snapshot
                        </p>
                        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
                            Pipeline quality and hiring momentum
                        </h1>
                        <p className="mt-2 text-sm text-blue-100">
                            Track candidate flow, application movement, and company engagement in one place.
                        </p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
                        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                            <p className="text-xs text-blue-100">Starred ratio</p>
                            <p className="mt-1 text-xl font-semibold">{starredRatio}%</p>
                        </div>
                        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                            <p className="text-xs text-blue-100">Active companies</p>
                            <p className="mt-1 text-xl font-semibold">{activeCompanyRatio}%</p>
                        </div>
                        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                            <p className="text-xs text-blue-100">Apps per candidate</p>
                            <p className="mt-1 text-xl font-semibold">{candidateToApplicationRatio}%</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summaryCards.map((card) => (
                    <article
                        key={card.key}
                        className={`rounded-2xl border border-border/70 p-5 shadow-sm ${card.tone}`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground/80">{card.label}</p>
                            <card.icon className="size-4 text-foreground/80" />
                        </div>
                        <p className="mt-4 text-3xl font-semibold tracking-tight">{summary[card.key]}</p>
                    </article>
                ))}
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-3">
                <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Applications Trend</h2>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                            <TrendingUp className="size-3.5" />
                            Last {breakdown.application_trend.length} months
                        </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                            <p className="text-xs text-muted-foreground">Total applications</p>
                            <p className="mt-1 text-lg font-semibold">{totalTrendApplications}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                            <p className="text-xs text-muted-foreground">Peak month</p>
                            <p className="mt-1 text-lg font-semibold">{bestTrendMonth.month}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                            <p className="text-xs text-muted-foreground">Peak applications</p>
                            <p className="mt-1 text-lg font-semibold">{bestTrendMonth.total}</p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-6 gap-2">
                        {breakdown.application_trend.map((item) => (
                            <div key={item.month} className="flex flex-col items-center gap-2">
                                <div className="flex h-32 w-full items-end rounded-lg bg-muted/40 p-1.5">
                                    <div
                                        className="w-full rounded-md bg-blue-700"
                                        style={{
                                            height: `${Math.max((item.total / maxTrendCount) * 100, 8)}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    {item.month.split(' ')[0]}
                                </span>
                                <span className="text-xs font-medium">{item.total}</span>
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
                        {breakdown.top_companies.map((company, index) => {
                            const share = summary.applications === 0
                                ? 0
                                : Math.round((company.applications_count / summary.applications) * 100);

                            return (
                                <div key={company.id} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                                {index + 1}
                                            </span>
                                            <span className="truncate text-sm font-medium">{company.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{share}%</span>
                                    </div>
                                    <div className="mt-2 h-1.5 rounded-full bg-muted/60">
                                        <div
                                            className="h-1.5 rounded-full bg-blue-700"
                                            style={{ width: `${Math.max(share, 6)}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {company.applications_count} applications
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </article>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-3">
                <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm xl:col-span-2">
                    <h2 className="text-base font-semibold">Applications by Status</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {breakdown.applications_by_status.length === 0 && (
                            <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
                        )}
                        {breakdown.applications_by_status.map((entry) => {
                            const percentage = summary.applications === 0
                                ? 0
                                : Math.round((entry.total / summary.applications) * 100);

                            return (
                                <div key={entry.status} className="rounded-xl border border-border/60 bg-background/60 p-3">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="capitalize">{entry.status}</span>
                                        <span className="font-medium">{entry.total}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted/60">
                                        <div
                                            className="h-2 rounded-full bg-blue-700"
                                            style={{ width: `${Math.max((entry.total / maxStatusCount) * 100, 6)}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {percentage}% of all applications
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </article>

                <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h2 className="text-base font-semibold">Pipeline Health</h2>
                    <div className="mt-4 space-y-3">
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">Candidate coverage</p>
                                <CheckCircle2 className="size-4 text-emerald-600" />
                            </div>
                            <p className="mt-1 text-xl font-semibold">{summary.total_candidates}</p>
                            <p className="text-xs text-muted-foreground">Profiles currently in recruiter scope.</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">Engaged companies</p>
                                <BriefcaseBusiness className="size-4 text-blue-700" />
                            </div>
                            <p className="mt-1 text-xl font-semibold">{summary.active_companies} / {summary.companies}</p>
                            <p className="text-xs text-muted-foreground">
                                {activeCompanyRatio}% of companies are active.
                            </p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">Prioritized candidates</p>
                                <Star className="size-4 text-amber-500" />
                            </div>
                            <p className="mt-1 text-xl font-semibold">{summary.starred_candidates}</p>
                            <p className="text-xs text-muted-foreground">
                                {starredRatio}% of visible candidates are starred.
                            </p>
                        </div>
                    </div>
                </article>
            </section>
        </RecruiterLayout>
    );
}
