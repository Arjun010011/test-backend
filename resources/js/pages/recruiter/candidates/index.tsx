import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, Filter, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { CandidateTable } from '@/components/recruiter/candidate-table';
import type { RecruiterCandidate } from '@/components/recruiter/candidate-table';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { index } from '@/routes/recruiter/candidates';
import { toggle } from '@/routes/recruiter/candidates/star';
import { destroy as destroyStatus, store as storeStatus, update as updateStatus } from '@/routes/recruiter/statuses';

type StatusOption = {
    id: number;
    value: string;
    label: string;
    color: string;
    is_default: boolean;
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
        passed_out?: boolean | null;
        has_resume?: boolean | null;
        sort?: string | null;
        collection?: number | null;
        include_keywords?: string | null;
        exclude_keywords?: string | null;
        city?: string | null;
        experience_min?: number | null;
        experience_max?: number | null;
        industries?: string[] | null;
        current_company?: string | null;
        previous_company?: string | null;
        salary_min?: number | null;
        salary_max?: number | null;
        degree?: string | null;
        major?: string | null;
        university?: string | null;
        gender?: string | null;
        age_min?: number | null;
        age_max?: number | null;
        languages?: string[] | null;
        english_fluency?: string | null;
    };
    statuses: StatusOption[];
    collections: { data: CollectionOption[] };
};

type FilterSectionProps = {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
};

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
    return (
        <Collapsible defaultOpen={defaultOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-semibold text-foreground">
                <span>{title}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}

export default function RecruiterCandidatesIndex({ candidates, filters, statuses, collections }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [starred, setStarred] = useState(filters.starred ?? false);
    const [passedOut, setPassedOut] = useState(filters.passed_out ?? false);
    const [hasResume, setHasResume] = useState(filters.has_resume ?? false);
    const [sort, setSort] = useState(filters.sort ?? 'latest');
    const [collection, setCollection] = useState<string>(
        filters.collection ? String(filters.collection) : '',
    );
    const [includeKeywords, setIncludeKeywords] = useState(filters.include_keywords ?? '');
    const [excludeKeywords, setExcludeKeywords] = useState(filters.exclude_keywords ?? '');
    const [city, setCity] = useState(filters.city ?? '');
    const [experienceMin, setExperienceMin] = useState(
        filters.experience_min !== null && filters.experience_min !== undefined
            ? String(filters.experience_min)
            : '',
    );
    const [experienceMax, setExperienceMax] = useState(
        filters.experience_max !== null && filters.experience_max !== undefined
            ? String(filters.experience_max)
            : '',
    );
    const [industries, setIndustries] = useState(
        filters.industries && filters.industries.length > 0
            ? filters.industries.join(', ')
            : '',
    );
    const [currentCompany, setCurrentCompany] = useState(filters.current_company ?? '');
    const [previousCompany, setPreviousCompany] = useState(filters.previous_company ?? '');
    const [salaryMin, setSalaryMin] = useState(
        filters.salary_min !== null && filters.salary_min !== undefined
            ? String(filters.salary_min)
            : '',
    );
    const [salaryMax, setSalaryMax] = useState(
        filters.salary_max !== null && filters.salary_max !== undefined
            ? String(filters.salary_max)
            : '',
    );
    const [degree, setDegree] = useState(filters.degree ?? '');
    const [major, setMajor] = useState(filters.major ?? '');
    const [university, setUniversity] = useState(filters.university ?? '');
    const [gender, setGender] = useState(filters.gender ?? '');
    const [ageMin, setAgeMin] = useState(
        filters.age_min !== null && filters.age_min !== undefined
            ? String(filters.age_min)
            : '',
    );
    const [ageMax, setAgeMax] = useState(
        filters.age_max !== null && filters.age_max !== undefined
            ? String(filters.age_max)
            : '',
    );
    const [languages, setLanguages] = useState(
        filters.languages && filters.languages.length > 0
            ? filters.languages.join(', ')
            : '',
    );
    const [englishFluency, setEnglishFluency] = useState(filters.english_fluency ?? '');
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
    const isMobile = useIsMobile();
    const statusForm = useForm({
        label: '',
        color: 'gray',
    });
    const statusEditForm = useForm({
        label: '',
        color: 'gray',
    });

    const query = useMemo(
        () => ({
            search: search.trim() === '' ? null : search,
            status: status === '' ? null : status,
            starred: starred ? 1 : null,
            passed_out: passedOut ? 1 : null,
            has_resume: hasResume ? 1 : null,
            sort,
            collection: collection === '' ? null : Number(collection),
            include_keywords: includeKeywords.trim() === '' ? null : includeKeywords,
            exclude_keywords: excludeKeywords.trim() === '' ? null : excludeKeywords,
            city: city.trim() === '' ? null : city,
            experience_min: experienceMin === '' ? null : Number(experienceMin),
            experience_max: experienceMax === '' ? null : Number(experienceMax),
            industries: industries.trim() === '' ? null : industries,
            current_company: currentCompany.trim() === '' ? null : currentCompany,
            previous_company: previousCompany.trim() === '' ? null : previousCompany,
            salary_min: salaryMin === '' ? null : Number(salaryMin),
            salary_max: salaryMax === '' ? null : Number(salaryMax),
            degree: degree.trim() === '' ? null : degree,
            major: major.trim() === '' ? null : major,
            university: university.trim() === '' ? null : university,
            gender: gender === '' ? null : gender,
            age_min: ageMin === '' ? null : Number(ageMin),
            age_max: ageMax === '' ? null : Number(ageMax),
            languages: languages.trim() === '' ? null : languages,
            english_fluency: englishFluency === '' ? null : englishFluency,
        }),
        [
            search,
            status,
            starred,
            passedOut,
            hasResume,
            sort,
            collection,
            includeKeywords,
            excludeKeywords,
            city,
            experienceMin,
            experienceMax,
            industries,
            currentCompany,
            previousCompany,
            salaryMin,
            salaryMax,
            degree,
            major,
            university,
            gender,
            ageMin,
            ageMax,
            languages,
            englishFluency,
        ],
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

    const customStatuses = statuses.filter((statusOption) => !statusOption.is_default);

    const startEditingStatus = (statusOption: StatusOption) => {
        setEditingStatusId(statusOption.id);
        statusEditForm.setData({
            label: statusOption.label,
            color: statusOption.color,
        });
        statusEditForm.clearErrors();
    };

    const cancelEditingStatus = () => {
        setEditingStatusId(null);
        statusEditForm.clearErrors();
    };

    const saveStatusChanges = () => {
        if (editingStatusId === null) {
            return;
        }

        statusEditForm.patch(updateStatus(editingStatusId).url, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingStatusId(null);
            },
        });
    };

    const deleteStatus = (statusId: number) => {
        router.delete(destroyStatus(statusId).url, {
            preserveScroll: true,
        });
    };

    const renderFilters = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Show only candidates who
                </div>
                <label className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
                    <input
                        type="checkbox"
                        checked={hasResume}
                        onChange={(event) => setHasResume(event.target.checked)}
                        className="size-4"
                    />
                    Have CV attached
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
                    <input
                        type="checkbox"
                        checked={starred}
                        onChange={(event) => setStarred(event.target.checked)}
                        className="size-4"
                    />
                    Are starred by me
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
                    <input
                        type="checkbox"
                        checked={passedOut}
                        onChange={(event) => setPassedOut(event.target.checked)}
                        className="size-4"
                    />
                    Are passed out
                </label>
            </div>

            <FilterSection title="Must-have keywords">
                <Input
                    value={includeKeywords}
                    onChange={(event) => setIncludeKeywords(event.target.value)}
                    placeholder="python, react, fintech"
                />
            </FilterSection>

            <FilterSection title="Current City / Area">
                <Input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Bengaluru"
                />
            </FilterSection>

            <FilterSection title="Exclude Keywords">
                <Input
                    value={excludeKeywords}
                    onChange={(event) => setExcludeKeywords(event.target.value)}
                    placeholder="intern, unpaid"
                />
            </FilterSection>

            <FilterSection title="Experience (Years)">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        value={experienceMin}
                        onChange={(event) => setExperienceMin(event.target.value)}
                        type="number"
                        min={0}
                        max={50}
                        placeholder="Min"
                    />
                    <Input
                        value={experienceMax}
                        onChange={(event) => setExperienceMax(event.target.value)}
                        type="number"
                        min={0}
                        max={50}
                        placeholder="Max"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Industries">
                <Input
                    value={industries}
                    onChange={(event) => setIndustries(event.target.value)}
                    placeholder="FinTech, SaaS"
                />
            </FilterSection>

            <FilterSection title="Current / Previous Company">
                <div className="grid gap-3">
                    <Input
                        value={currentCompany}
                        onChange={(event) => setCurrentCompany(event.target.value)}
                        placeholder="Current company"
                    />
                    <Input
                        value={previousCompany}
                        onChange={(event) => setPreviousCompany(event.target.value)}
                        placeholder="Previous company"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Annual Salary (LPA)">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        value={salaryMin}
                        onChange={(event) => setSalaryMin(event.target.value)}
                        type="number"
                        min={0}
                        max={1000}
                        placeholder="Min"
                    />
                    <Input
                        value={salaryMax}
                        onChange={(event) => setSalaryMax(event.target.value)}
                        type="number"
                        min={0}
                        max={1000}
                        placeholder="Max"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Degrees / Specialization">
                <div className="grid gap-3">
                    <Input
                        value={degree}
                        onChange={(event) => setDegree(event.target.value)}
                        placeholder="Degree"
                    />
                    <Input
                        value={major}
                        onChange={(event) => setMajor(event.target.value)}
                        placeholder="Specialization"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Education">
                <Input
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                    placeholder="College / University"
                />
            </FilterSection>

            <FilterSection title="Gender">
                <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
            </FilterSection>

            <FilterSection title="Age">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        value={ageMin}
                        onChange={(event) => setAgeMin(event.target.value)}
                        type="number"
                        min={16}
                        max={80}
                        placeholder="Min"
                    />
                    <Input
                        value={ageMax}
                        onChange={(event) => setAgeMax(event.target.value)}
                        type="number"
                        min={16}
                        max={80}
                        placeholder="Max"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Languages">
                <Input
                    value={languages}
                    onChange={(event) => setLanguages(event.target.value)}
                    placeholder="English, Hindi"
                />
            </FilterSection>

            <FilterSection title="English Fluency Level">
                <select
                    value={englishFluency}
                    onChange={(event) => setEnglishFluency(event.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                    <option value="">All</option>
                    <option value="basic">Basic</option>
                    <option value="conversational">Conversational</option>
                    <option value="fluent">Fluent</option>
                    <option value="native">Native</option>
                </select>
            </FilterSection>

            <FilterSection title="Status">
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
            </FilterSection>

            <FilterSection title="Collection">
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
            </FilterSection>

            <FilterSection title="Sort">
                <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                    <option value="latest">Latest</option>
                    <option value="most_starred">Most Starred</option>
                </select>
            </FilterSection>
        </div>
    );

    return (
        <RecruiterLayout title="Candidates" search={search} onSearchChange={setSearch}>
            <Head title="Candidates" />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Search className="size-4" />
                        <span>{candidates.meta.total} candidates found</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isMobile && (
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setShowFilters(true)}
                            >
                                <Filter className="size-4" />
                                Filters
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
                    <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            statusForm.post(storeStatus().url, {
                                preserveScroll: true,
                                onSuccess: () => statusForm.reset('label'),
                            });
                        }}
                    >
                        <Input
                            value={statusForm.data.label}
                            onChange={(event) => statusForm.setData('label', event.target.value)}
                            placeholder="Create global custom status"
                            className="max-w-sm"
                        />
                        <select
                            value={statusForm.data.color}
                            onChange={(event) => statusForm.setData('color', event.target.value)}
                            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            <option value="gray">Gray</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="red">Red</option>
                            <option value="purple">Purple</option>
                            <option value="amber">Amber</option>
                            <option value="cyan">Cyan</option>
                        </select>
                        <Button type="submit" disabled={statusForm.processing}>
                            {statusForm.processing ? 'Saving...' : 'Add Status'}
                        </Button>
                    </form>
                    {statusForm.errors.label && (
                        <p className="mt-2 text-sm text-red-600">{statusForm.errors.label}</p>
                    )}
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
                    <h2 className="text-sm font-semibold text-foreground">Manage custom statuses</h2>
                    {customStatuses.length === 0 && (
                        <p className="text-sm text-muted-foreground">No custom statuses yet.</p>
                    )}
                    {customStatuses.map((statusOption) => {
                        const isEditing = editingStatusId === statusOption.id;

                        if (isEditing) {
                            return (
                                <form
                                    key={statusOption.id}
                                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-2"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        saveStatusChanges();
                                    }}
                                >
                                    <Input
                                        value={statusEditForm.data.label}
                                        onChange={(event) => statusEditForm.setData('label', event.target.value)}
                                        className="max-w-sm"
                                    />
                                    <select
                                        value={statusEditForm.data.color}
                                        onChange={(event) => statusEditForm.setData('color', event.target.value)}
                                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="gray">Gray</option>
                                        <option value="blue">Blue</option>
                                        <option value="green">Green</option>
                                        <option value="red">Red</option>
                                        <option value="purple">Purple</option>
                                        <option value="amber">Amber</option>
                                        <option value="cyan">Cyan</option>
                                    </select>
                                    <Button type="submit" size="sm" disabled={statusEditForm.processing}>
                                        Save
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={cancelEditingStatus}>
                                        Cancel
                                    </Button>
                                    {statusEditForm.errors.label && (
                                        <p className="w-full text-sm text-red-600">{statusEditForm.errors.label}</p>
                                    )}
                                </form>
                            );
                        }

                        return (
                            <div
                                key={statusOption.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/60 p-2"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{statusOption.label}</span>
                                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
                                        {statusOption.color}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => startEditingStatus(statusOption)}>
                                        Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteStatus(statusOption.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="hidden lg:block">
                        <div className="sticky top-6 space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                            {renderFilters()}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <CandidateTable
                            candidates={candidates.data}
                            loading={loading}
                            onToggleStar={toggleStar}
                            skillSearchTerm={filters.search ?? search}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm shadow-sm">
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
                            Refine candidates by skills, experience, and profile details.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 p-4">{renderFilters()}</div>
                </SheetContent>
            </Sheet>
        </RecruiterLayout>
    );
}
