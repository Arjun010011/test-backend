import { Head, Link } from '@inertiajs/react';
import { FolderKanban, Star, UserPlus, Users } from 'lucide-react';
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
        className: 'bg-blue-300/85 text-blue-950 dark:bg-blue-900/45 dark:text-blue-100',
    },
    {
        key: 'starred_candidates',
        label: 'Starred Candidates',
        icon: Star,
        className: 'bg-blue-300/85 text-blue-950 dark:bg-blue-900/45 dark:text-blue-100',
    },
    {
        key: 'active_collections',
        label: 'Active Collections',
        icon: FolderKanban,
        className: 'bg-blue-300/85 text-blue-950 dark:bg-blue-900/45 dark:text-blue-100',
    },
    {
        key: 'recently_added',
        label: 'Recently Added',
        icon: UserPlus,
        className: 'bg-blue-300/85 text-blue-950 dark:bg-blue-900/45 dark:text-blue-100',
    },
] as const;

export default function RecruiterDashboard({ stats }: Props) {
    return (
        <RecruiterLayout title="Recruiter Dashboard">
            <Head title="Recruiter Dashboard" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.key}
                        className={`rounded-2xl border border-border/70 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm font-medium text-foreground/75">{card.label}</div>
                                <div className="mt-2 text-3xl font-semibold text-foreground">
                                    {stats[card.key]}
                                </div>
                            </div>
                            <card.icon className="size-5" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Link
                    href={candidatesIndex().url}
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-colors hover:bg-accent/40"
                >
                    <div className="text-sm font-semibold">Explore candidates</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review profiles, update statuses, and save shortlist collections.
                    </p>
                </Link>
                <Link
                    href={collectionsIndex().url}
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-colors hover:bg-accent/40"
                >
                    <div className="text-sm font-semibold">Manage collections</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Group candidates into pipelines and collaborate efficiently.
                    </p>
                </Link>
                <Link
                    href={companiesIndex().url}
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-colors hover:bg-accent/40"
                >
                    <div className="text-sm font-semibold">Enroll companies</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add companies so candidates can discover openings and apply.
                    </p>
                </Link>
                <Link
                    href={assessmentsIndex().url}
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-colors hover:bg-accent/40"
                >
                    <div className="text-sm font-semibold">Assessments</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create tests by topic and difficulty, then assign to candidate colleges.
                    </p>
                </Link>
                <Link
                    href={recruiterAnalytics().url}
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-colors hover:bg-accent/40"
                >
                    <div className="text-sm font-semibold">Analytics</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track recruiter-side performance metrics and pipeline quality trends.
                    </p>
                </Link>
                <Link
                    href={candidatesIndex.url({
                        query: {
                            passed_out: 1,
                        },
                    })}
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-colors hover:bg-accent/40"
                >
                    <div className="text-sm font-semibold">Passed out candidates</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        View candidates whose studies are completed based on graduation year or semester progression.
                    </p>
                </Link>
            </div>
        </RecruiterLayout>
    );
}
