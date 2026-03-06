import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Calendar, Filter, MapPin, Search, UserCircle, Users } from 'lucide-react';
import {  useMemo, useState } from 'react';
import type {ReactNode} from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { companyApplicationStatuses } from '@/lib/company-application-statuses';
import { index as companiesIndex } from '@/routes/recruiter/companies';
import { show as showApplication, update as updateApplication } from '@/routes/recruiter/companies/applications';

type Company = {
    id: number;
    name: string;
    job_role: string | null;
    website: string | null;
    location: string | null;
    description: string | null;
    salary_min_lpa: number | null;
    salary_max_lpa: number | null;
    experience_min_years: number | null;
    experience_max_years: number | null;
    employment_type: string | null;
    work_mode: string | null;
    openings: number | null;
    skills_required: string | null;
    application_deadline: string | null;
    is_active: boolean;
    source: string;
    approval_status: string;
    visibility: string;
    created_by_name: string | null;
    owner_name: string | null;
    created_at: string | null;
};

type Application = {
    id: number;
    status: string;
    review_note: string | null;
    applied_at: string | null;
    cover_letter_preview: string | null;
    candidate: {
        id: number | null;
        name: string | null;
        email: string | null;
    };
};

type Props = {
    company: Company;
    applications: { data: Application[] };
};

type SortMode = 'newest' | 'oldest' | 'candidate';

function formatSalary(min: number | null, max: number | null): string | null {
    if (min === null && max === null) {
        return null;
    }

    if (min !== null && max !== null) {
        return `${min} - ${max} LPA`;
    }

    if (min !== null) {
        return `From ${min} LPA`;
    }

    return `Up to ${max} LPA`;
}

function formatExperience(min: number | null, max: number | null): string | null {
    if (min === null && max === null) {
        return null;
    }

    if (min !== null && max !== null) {
        return `${min} - ${max} years`;
    }

    if (min !== null) {
        return `${min}+ years`;
    }

    return `Up to ${max} years`;
}

function humanize(value: string | null): string | null {
    if (value === null) {
        return null;
    }

    return value.replaceAll('_', ' ');
}

function humanizeStatus(value: string): string {
    return value.replaceAll('_', ' ');
}

function formatAppliedAt(value: string | null): string {
    if (value === null) {
        return 'Applied recently';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
}

export default function RecruiterCompanyShow({ company, applications }: Props) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortMode, setSortMode] = useState<SortMode>('newest');

    const statusCounts = useMemo(() => {
        return applications.data.reduce<Record<string, number>>((counts, application) => {
            counts[application.status] = (counts[application.status] ?? 0) + 1;

            return counts;
        }, {});
    }, [applications.data]);

    const filteredApplications = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        const filtered = applications.data.filter((application) => {
            if (statusFilter !== 'all' && application.status !== statusFilter) {
                return false;
            }

            if (normalizedQuery === '') {
                return true;
            }

            const candidateName = application.candidate.name?.toLowerCase() ?? '';
            const candidateEmail = application.candidate.email?.toLowerCase() ?? '';

            return candidateName.includes(normalizedQuery) || candidateEmail.includes(normalizedQuery);
        });

        return filtered.sort((a, b) => {
            if (sortMode === 'candidate') {
                return (a.candidate.name ?? '').localeCompare(b.candidate.name ?? '');
            }

            const aTimestamp = a.applied_at === null ? 0 : new Date(a.applied_at).getTime();
            const bTimestamp = b.applied_at === null ? 0 : new Date(b.applied_at).getTime();

            if (sortMode === 'oldest') {
                return aTimestamp - bTimestamp;
            }

            return bTimestamp - aTimestamp;
        });
    }, [applications.data, searchQuery, sortMode, statusFilter]);

    const salary = formatSalary(company.salary_min_lpa, company.salary_max_lpa);
    const experience = formatExperience(company.experience_min_years, company.experience_max_years);

    return (
        <RecruiterLayout title={`${company.name} Applications`}>
            <Head title={`${company.name} Applications`} />

            <div className="space-y-5">
                <section className="rounded-3xl border border-border/70 bg-linear-to-br from-blue-700 via-blue-700 to-blue-600 p-6 text-white shadow-lg">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                                <Building2 className="size-3.5" />
                                Company profile
                            </div>
                            <h2 className="mt-3 text-2xl font-semibold">{company.name}</h2>
                            <p className="mt-1 text-sm text-blue-100">
                                {company.is_active ? 'Visible to candidates' : 'Hidden from candidates'}
                            </p>
                        </div>
                        <Link href={companiesIndex().url} className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20">
                            Back to companies
                        </Link>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <CompanyStat label="Applications" value={String(applications.data.length)} />
                        <CompanyStat label="Role" value={company.job_role ?? 'Not specified'} />
                        <CompanyStat label="Salary" value={salary ?? 'Not specified'} />
                        <CompanyStat label="Experience" value={experience ?? 'Not specified'} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-blue-100">
                        {humanize(company.employment_type) && <MetaPill label="Type" value={humanize(company.employment_type) ?? ''} />}
                        {humanize(company.work_mode) && <MetaPill label="Mode" value={humanize(company.work_mode) ?? ''} />}
                        {company.openings !== null && <MetaPill label="Openings" value={String(company.openings)} />}
                        {company.application_deadline && <MetaPill label="Deadline" value={company.application_deadline} icon={<Calendar className="size-3.5" />} />}
                        {company.location && <MetaPill label="Location" value={company.location} icon={<MapPin className="size-3.5" />} />}
                        <MetaPill label="Source" value={company.source} />
                        <MetaPill label="Approval" value={company.approval_status} />
                        <MetaPill label="Visibility" value={company.visibility} />
                        {company.created_by_name && <MetaPill label="Enrolled by" value={company.created_by_name} icon={<UserCircle className="size-3.5" />} />}
                        {company.owner_name && <MetaPill label="Owner" value={company.owner_name} icon={<Users className="size-3.5" />} />}
                    </div>

                    {company.skills_required && <p className="mt-3 text-sm text-blue-100"><span className="font-medium text-white">Skills:</span> {company.skills_required}</p>}
                    {company.description && <p className="mt-3 text-sm text-blue-100">{company.description}</p>}
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-base font-semibold">Applications</h3>
                            <p className="text-sm text-muted-foreground">
                                {filteredApplications.length} of {applications.data.length} candidates shown
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_auto_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search candidate name or email"
                                className="h-10 rounded-lg border-border/70 bg-background/90 pl-9 shadow-xs"
                            />
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/90 px-2 py-1 shadow-xs">
                            <Filter className="size-4" />
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="h-8 w-[170px] border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    {companyApplicationStatuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {humanizeStatus(status)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/90 px-2 py-1 shadow-xs">
                            <span>Sort</span>
                            <Select
                                value={sortMode}
                                onValueChange={(value) => setSortMode(value as SortMode)}
                            >
                                <SelectTrigger className="h-8 w-[170px] border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest applied</SelectItem>
                                    <SelectItem value="oldest">Oldest applied</SelectItem>
                                    <SelectItem value="candidate">Candidate name</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <StatusFilterPill
                            label="All"
                            count={applications.data.length}
                            active={statusFilter === 'all'}
                            onClick={() => setStatusFilter('all')}
                        />
                        {companyApplicationStatuses.map((status) => (
                            <StatusFilterPill
                                key={status}
                                label={humanizeStatus(status)}
                                count={statusCounts[status] ?? 0}
                                active={statusFilter === status}
                                onClick={() => setStatusFilter(status)}
                            />
                        ))}
                    </div>

                    {applications.data.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">No student applications yet.</p>
                    ) : filteredApplications.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed border-border/80 bg-background/50 p-8 text-center">
                            <p className="text-sm font-medium">No applications match your filters.</p>
                            <p className="mt-1 text-sm text-muted-foreground">Try clearing search or switching status.</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setSortMode('newest');
                                }}
                            >
                                Reset filters
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {filteredApplications.map((application) => (
                                <ApplicationReviewCard
                                    key={application.id}
                                    companyId={company.id}
                                    application={application}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </RecruiterLayout>
    );
}

type ApplicationReviewCardProps = {
    companyId: number;
    application: Application;
};

function ApplicationReviewCard({ companyId, application }: ApplicationReviewCardProps) {
    const reviewForm = useForm({
        status: application.status,
        review_note: application.review_note ?? '',
    });

    return (
        <article className="rounded-xl border border-border/70 bg-background/40 p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold">
                        {application.candidate.name ?? 'Unknown candidate'}
                    </div>
                    {application.candidate.email && (
                        <div className="text-xs text-muted-foreground">{application.candidate.email}</div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                        {humanizeStatus(reviewForm.data.status)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                        {formatAppliedAt(application.applied_at)}
                    </div>
                </div>
            </div>
            {application.cover_letter_preview && (
                <p className="mt-3 text-sm text-muted-foreground">{application.cover_letter_preview}</p>
            )}

            <div className="mt-3 space-y-2">
                <Select
                    value={reviewForm.data.status}
                    onValueChange={(value) => reviewForm.setData('status', value)}
                >
                    <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background/90">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {companyApplicationStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                                {humanizeStatus(status)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={reviewForm.errors.status} />
                <textarea
                    value={reviewForm.data.review_note}
                    onChange={(event) => reviewForm.setData('review_note', event.target.value)}
                    rows={3}
                    className="focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-lg border border-border/70 bg-background/90 px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                    placeholder="Recruiter/company note for this role"
                />
                <InputError message={reviewForm.errors.review_note} />
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                            reviewForm.patch(
                                updateApplication({
                                    company: companyId,
                                    application: application.id,
                                }).url,
                                { preserveScroll: true },
                            )
                        }
                        disabled={reviewForm.processing || !reviewForm.isDirty}
                    >
                        {reviewForm.processing ? 'Saving...' : 'Save review'}
                    </Button>
                    {reviewForm.isDirty && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => reviewForm.reset()}
                            disabled={reviewForm.processing}
                        >
                            Reset
                        </Button>
                    )}
                </div>
                <Link
                    href={showApplication({ company: companyId, application: application.id }).url}
                    className="rounded-lg border border-border/70 px-3 py-1.5 text-sm font-medium hover:bg-muted/50"
                >
                    View details
                </Link>
            </div>
        </article>
    );
}

type CompanyStatProps = {
    label: string;
    value: string;
};

function CompanyStat({ label, value }: CompanyStatProps) {
    return (
        <div className="rounded-xl border border-white/20 bg-white/10 p-3">
            <p className="text-xs text-blue-100">{label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{value}</p>
        </div>
    );
}

type MetaPillProps = {
    label: string;
    value: string;
    icon?: ReactNode;
};

function MetaPill({ label, value, icon }: MetaPillProps) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1">
            {icon}
            <span className="text-white">{label}:</span> {value}
        </span>
    );
}

type StatusFilterPillProps = {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
};

function StatusFilterPill({ label, count, active, onClick }: StatusFilterPillProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                    ? 'border-blue-200 bg-blue-100 text-blue-800'
                    : 'border-border/70 bg-background text-muted-foreground hover:bg-muted/40'
            }`}
        >
            <span className="capitalize">{label}</span>
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] text-foreground">{count}</span>
        </button>
    );
}
