import { Head, Link } from '@inertiajs/react';
import { FolderKanban, Star, UserPlus, Users } from 'lucide-react';
import RecruiterLayout from '@/layouts/recruiter-layout';
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
        className: 'from-sky-500/20 to-sky-100/50 text-sky-800 dark:from-sky-500/25 dark:to-sky-400/10 dark:text-sky-200',
    },
    {
        key: 'starred_candidates',
        label: 'Starred Candidates',
        icon: Star,
        className: 'from-amber-500/20 to-amber-100/50 text-amber-800 dark:from-amber-500/25 dark:to-amber-400/10 dark:text-amber-200',
    },
    {
        key: 'active_collections',
        label: 'Active Collections',
        icon: FolderKanban,
        className: 'from-emerald-500/20 to-emerald-100/50 text-emerald-800 dark:from-emerald-500/25 dark:to-emerald-400/10 dark:text-emerald-200',
    },
    {
        key: 'recently_added',
        label: 'Recently Added',
        icon: UserPlus,
        className: 'from-indigo-500/20 to-indigo-100/50 text-indigo-800 dark:from-indigo-500/25 dark:to-indigo-400/10 dark:text-indigo-200',
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
                        className={`rounded-2xl border border-border/70 bg-gradient-to-br p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
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
