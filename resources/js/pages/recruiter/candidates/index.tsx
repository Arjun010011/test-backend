import { Head, router } from '@inertiajs/react';
import { Filter, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CandidateTable, type RecruiterCandidate } from '@/components/recruiter/candidate-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { index } from '@/routes/recruiter/candidates';
import { toggle } from '@/routes/recruiter/candidates/star';

type StatusOption = {
    value: string;
    label: string;
};

type CollectionOption = {
    id: number;
    name: string;
};

type PaginatedCandidates = {
    data: RecruiterCandidate[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
    };
    links: {
        prev: string | null;
        next: string | null;
    };
};

type Props = {
    candidates: PaginatedCandidates;
    filters: {
        search?: string | null;
        status?: string | null;
        starred?: boolean | null;
        sort?: string | null;
        collection?: number | null;
    };
    statuses: StatusOption[];
    collections: { data: CollectionOption[] };
};

export default function RecruiterCandidatesIndex({ candidates, filters, statuses, collections }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [starred, setStarred] = useState(filters.starred ?? false);
    const [sort, setSort] = useState(filters.sort ?? 'latest');
    const [collection, setCollection] = useState<string>(
        filters.collection ? String(filters.collection) : '',
    );
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);

    const query = useMemo(
        () => ({
            search: search.trim() === '' ? null : search,
            status: status === '' ? null : status,
            starred: starred ? 1 : null,
            sort,
            collection: collection === '' ? null : Number(collection),
        }),
        [search, status, starred, sort, collection],
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setLoading(true);
            router.get(index.url({ query }), {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            });
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [query]);

    const toggleStar = (candidateId: number) => {
        router.post(toggle(candidateId).url, {}, { preserveScroll: true, preserveState: true });
    };

    return (
        <RecruiterLayout title="Candidates" search={search} onSearchChange={setSearch}>
            <Head title="Candidates" />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Search className="size-4" />
                        <span>{candidates.meta.total} candidates found</span>
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setShowFilters(true)}
                    >
                        <Filter className="size-4" />
                        Filters
                    </Button>
                </div>

                <CandidateTable
                    candidates={candidates.data}
                    loading={loading}
                    onToggleStar={toggleStar}
                />

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm shadow-sm">
                    <div>
                        Page {candidates.meta.current_page} of {candidates.meta.last_page}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={candidates.links.prev === null}
                            onClick={() =>
                                router.get(candidates.links.prev ?? index().url, {}, { preserveState: true, preserveScroll: true })
                            }
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={candidates.links.next === null}
                            onClick={() =>
                                router.get(candidates.links.next ?? index().url, {}, { preserveState: true, preserveScroll: true })
                            }
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetContent side="right">
                    <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription>
                            Refine candidates by status, starring, sorting, and collection.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 p-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            >
                                <option value="">All statuses</option>
                                {statuses.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Collection
                            </label>
                            <select
                                value={collection}
                                onChange={(event) => setCollection(event.target.value)}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            >
                                <option value="">All collections</option>
                                {collections.data.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Sort
                            </label>
                            <select
                                value={sort}
                                onChange={(event) => setSort(event.target.value)}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            >
                                <option value="latest">Latest</option>
                                <option value="most_starred">Most Starred</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
                            <input
                                type="checkbox"
                                checked={starred}
                                onChange={(event) => setStarred(event.target.checked)}
                                className="size-4"
                            />
                            Show only starred candidates
                        </label>

                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, email, skill"
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </RecruiterLayout>
    );
}
