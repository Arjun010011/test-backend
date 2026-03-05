import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    BriefcaseBusiness,
    FolderKanban,
    Sparkles,
    Star,
    UserPlus,
    Users,
} from 'lucide-react';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { analytics as recruiterAnalytics } from '@/routes/recruiter';
import { index as assessmentsIndex } from '@/routes/recruiter/assessments';
import { index as candidatesIndex } from '@/routes/recruiter/candidates';
import { index as collectionsIndex } from '@/routes/recruiter/collections';
import { index as companiesIndex } from '@/routes/recruiter/companies';

type Props = {
    stats: {
        total_candidates: number;
        starred_candidates: number;
        active_collections: number;
        recently_added: number;
    };
};

const cards = [
    {
        key: 'total_candidates',
        label: 'Total Candidates',
        icon: Users,
        className: 'bg-sky-100/80 dark:bg-sky-900/35',
    },
    {
        key: 'starred_candidates',
        label: 'Starred Candidates',
        icon: Star,
        className: 'bg-amber-100/80 dark:bg-amber-900/35',
    },
    {
        key: 'active_collections',
        label: 'Active Collections',
        icon: FolderKanban,
        className: 'bg-violet-100/80 dark:bg-violet-900/35',
    },
    {
        key: 'recently_added',
        label: 'Recently Added',
        icon: UserPlus,
        className: 'bg-emerald-100/80 dark:bg-emerald-900/35',
    },
] as const;

const quickActions = [
    {
        title: 'Explore candidates',
        description: 'Review profiles, update status, and shortlist quickly.',
        href: candidatesIndex().url,
        icon: Users,
    },
    {
        title: 'Manage collections',
        description: 'Organize hiring pipelines by team, role, or priority.',
        href: collectionsIndex().url,
        icon: FolderKanban,
    },
    {
        title: 'Enroll companies',
        description: 'Add and manage companies publishing recruitment openings.',
        href: companiesIndex().url,
        icon: BriefcaseBusiness,
    },
    {
        title: 'Assessments',
        description: 'Create and assign assessments to evaluate candidates.',
        href: assessmentsIndex().url,
        icon: Sparkles,
    },
    {
        title: 'Analytics',
        description: 'Track pipeline quality, activity, and hiring momentum.',
        href: recruiterAnalytics().url,
        icon: BarChart3,
    },
    {
        title: 'Passed out candidates',
        description: 'Filter for candidates who have completed their studies.',
        href: candidatesIndex.url({
            query: {
                passed_out: 1,
            },
        }),
        icon: UserPlus,
    },
] as const;

export default function RecruiterDashboard({ stats }: Props) {
    const starredRatio = stats.total_candidates === 0
        ? 0
        : Math.round((stats.starred_candidates / stats.total_candidates) * 100);
    const collectionCoverage = stats.total_candidates === 0
        ? 0
        : Math.round((stats.active_collections / stats.total_candidates) * 100);

    return (
        <RecruiterLayout title="Recruiter Dashboard">
            <Head title="Recruiter Dashboard" />

            <section className="rounded-3xl border border-border/70 bg-blue-700 p-6 text-white shadow-lg">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                            <Sparkles className="size-3.5" />
                            Recruiter workspace
                        </p>
                        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
                            Hiring command center
                        </h1>
                        <p className="mt-2 text-sm text-blue-100">
                            Keep candidate pipelines active, prioritize the right profiles, and move faster with focused actions.
                        </p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                            <p className="text-xs text-blue-100">Starred ratio</p>
                            <p className="mt-1 text-xl font-semibold">{starredRatio}%</p>
                        </div>
                        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                            <p className="text-xs text-blue-100">Collection coverage</p>
                            <p className="mt-1 text-xl font-semibold">{collectionCoverage}%</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <article
                        key={card.key}
                        className={`rounded-2xl border border-border/70 p-5 shadow-sm transition-colors ${card.className}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm font-medium text-foreground/75">
                                    {card.label}
                                </div>
                                <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                                    {stats[card.key]}
                                </div>
                            </div>
                            <card.icon className="size-5 text-foreground/80" />
                        </div>
                    </article>
                ))}
            </section>

            <section className="mt-6 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
                        <p className="text-sm text-muted-foreground">
                            Jump directly to the most common recruiter workflows.
                        </p>
                    </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className="group rounded-2xl border border-border/70 bg-background/60 p-5 shadow-xs transition-colors hover:bg-accent/40"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                        <action.icon className="size-4.5" />
                                    </span>
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {action.title}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </RecruiterLayout>
    );
}
