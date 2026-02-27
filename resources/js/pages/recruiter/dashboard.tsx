import { Head, Link } from '@inertiajs/react';
import { FolderKanban, Star, UserPlus, Users } from 'lucide-react';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { index as candidatesIndex } from '@/routes/recruiter/candidates';
import { index as collectionsIndex } from '@/routes/recruiter/collections';

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
        className: 'from-sky-500/10 to-sky-100/40 text-sky-700',
    },
    {
        key: 'starred_candidates',
        label: 'Starred Candidates',
        icon: Star,
        className: 'from-amber-500/10 to-amber-100/40 text-amber-700',
    },
    {
        key: 'active_collections',
        label: 'Active Collections',
        icon: FolderKanban,
        className: 'from-emerald-500/10 to-emerald-100/40 text-emerald-700',
    },
    {
        key: 'recently_added',
        label: 'Recently Added',
        icon: UserPlus,
        className: 'from-violet-500/10 to-violet-100/40 text-violet-700',
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
                        className={`rounded-2xl border border-white/70 bg-gradient-to-br p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm font-medium text-slate-600">{card.label}</div>
                                <div className="mt-2 text-3xl font-semibold text-slate-900">
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
                    className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
                >
                    <div className="text-sm font-semibold">Explore candidates</div>
                    <p className="mt-1 text-sm text-slate-600">
                        Review profiles, update statuses, and save shortlist collections.
                    </p>
                </Link>
                <Link
                    href={collectionsIndex().url}
                    className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
                >
                    <div className="text-sm font-semibold">Manage collections</div>
                    <p className="mt-1 text-sm text-slate-600">
                        Group candidates into pipelines and collaborate efficiently.
                    </p>
                </Link>
            </div>
        </RecruiterLayout>
    );
}
