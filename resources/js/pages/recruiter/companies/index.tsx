import { Head, Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { approve, destroy, index as companiesIndex, show, store } from '@/routes/recruiter/companies';
import { update as updateVisibility } from '@/routes/recruiter/companies/visibility';

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
    applications_count: number;
    created_by_name: string | null;
    owner_name: string | null;
    created_at: string | null;
};

type Props = {
    companies: { data: Company[] };
    filters: {
        search: string;
        source: string;
        visibility: string;
        approval_status: string;
    };
    status?: string;
};

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

export default function RecruiterCompaniesIndex({ companies, filters, status }: Props) {
    const form = useForm({
        name: '',
        website: '',
        location: '',
        description: '',
        is_active: true,
    });
    const filterForm = useForm({
        search: filters.search ?? '',
        source: filters.source ?? '',
        visibility: filters.visibility ?? '',
        approval_status: filters.approval_status ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const applyFilters = () => {
        router.get(
            companiesIndex().url,
            {
                search: filterForm.data.search || undefined,
                source: filterForm.data.source || undefined,
                visibility: filterForm.data.visibility || undefined,
                approval_status: filterForm.data.approval_status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        filterForm.setData({
            search: '',
            source: '',
            visibility: '',
            approval_status: '',
        });

        router.get(companiesIndex().url, {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const hasActiveFilters = useMemo(
        () =>
            Boolean(
                filterForm.data.search ||
                    filterForm.data.source ||
                    filterForm.data.visibility ||
                    filterForm.data.approval_status,
            ),
        [filterForm.data.search, filterForm.data.source, filterForm.data.visibility, filterForm.data.approval_status],
    );

    return (
        <RecruiterLayout title="Companies">
            <Head title="Companies" />

            <div className="space-y-4">
                {status === 'company-enrolled' && (
                    <div className="rounded-lg border border-blue-300/70 bg-blue-200/70 px-4 py-3 text-sm text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
                        Company enrolled successfully.
                    </div>
                )}
                {status === 'company-visibility-updated' && (
                    <div className="rounded-lg border border-blue-300/70 bg-blue-200/70 px-4 py-3 text-sm text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
                        Company visibility updated.
                    </div>
                )}
                {status === 'company-deleted' && (
                    <div className="rounded-lg border border-blue-300/70 bg-blue-200/70 px-4 py-3 text-sm text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
                        Company deleted successfully.
                    </div>
                )}

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h2 className="text-base font-semibold">Enroll company</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a company to make it visible to candidates.
                    </p>

                    <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Company name
                            </label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                placeholder="Acme Technologies"
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="website" className="text-sm font-medium">
                                Website
                            </label>
                            <Input
                                id="website"
                                value={form.data.website}
                                onChange={(event) => form.setData('website', event.target.value)}
                                placeholder="https://acme.example"
                            />
                            <InputError message={form.errors.website} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="location" className="text-sm font-medium">
                                Location
                            </label>
                            <Input
                                id="location"
                                value={form.data.location}
                                onChange={(event) => form.setData('location', event.target.value)}
                                placeholder="Bengaluru, India"
                            />
                            <InputError message={form.errors.location} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="description" className="text-sm font-medium">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                rows={4}
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                placeholder="Short description about the company and roles."
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                            />
                            Active and visible to candidates
                        </label>

                        <div className="md:col-span-2">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving...' : 'Enroll company'}
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h2 className="text-base font-semibold">All Registered Companies</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Recruiters can view all registered companies and manage visibility or delete.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Input
                            value={filterForm.data.search}
                            onChange={(event) => filterForm.setData('search', event.target.value)}
                            placeholder="Search name/role/location"
                        />
                        <select
                            value={filterForm.data.source}
                            onChange={(event) => filterForm.setData('source', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All sources</option>
                            <option value="company">Company</option>
                            <option value="recruiter">Recruiter</option>
                        </select>
                        <select
                            value={filterForm.data.visibility}
                            onChange={(event) => filterForm.setData('visibility', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All visibility</option>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                        <select
                            value={filterForm.data.approval_status}
                            onChange={(event) => filterForm.setData('approval_status', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All approval</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={applyFilters}>
                            Apply Filters
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={resetFilters} disabled={!hasActiveFilters}>
                            Clear
                        </Button>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {companies.data.map((company) => (
                        <article
                            key={company.id}
                            className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-base font-semibold">{company.name}</h3>
                                <span className="rounded-full border border-border/70 px-2 py-1 text-xs">
                                    {company.is_active ? 'Active' : 'Hidden'}
                                </span>
                            </div>
                            {company.description && (
                                <p className="mt-2 text-sm text-muted-foreground">{company.description}</p>
                            )}
                            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                {company.job_role && <div>Role: {company.job_role}</div>}
                                {company.location && <div>Location: {company.location}</div>}
                                {formatSalary(company.salary_min_lpa, company.salary_max_lpa) && (
                                    <div>Salary: {formatSalary(company.salary_min_lpa, company.salary_max_lpa)}</div>
                                )}
                                {formatExperience(company.experience_min_years, company.experience_max_years) && (
                                    <div>
                                        Experience: {formatExperience(company.experience_min_years, company.experience_max_years)}
                                    </div>
                                )}
                                {humanize(company.employment_type) && <div>Type: {humanize(company.employment_type)}</div>}
                                {humanize(company.work_mode) && <div>Mode: {humanize(company.work_mode)}</div>}
                                {company.openings !== null && <div>Openings: {company.openings}</div>}
                                {company.application_deadline && <div>Deadline: {company.application_deadline}</div>}
                                {company.skills_required && <div>Skills: {company.skills_required}</div>}
                                {company.website && <div>Website: {company.website}</div>}
                                <div>Source: {company.source}</div>
                                <div>Approval: {company.approval_status}</div>
                                <div>Visibility: {company.visibility}</div>
                                <div>Applications: {company.applications_count}</div>
                                {company.created_by_name && <div>Enrolled by: {company.created_by_name}</div>}
                                {company.owner_name && <div>Company owner: {company.owner_name}</div>}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Link
                                    href={show(company.id).url}
                                    className="text-sm font-medium text-primary hover:text-primary/80"
                                >
                                    View applications
                                </Link>
                                {company.approval_status === 'pending' && (
                                    <button
                                        type="button"
                                        className="rounded-md border border-blue-400/60 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200/60"
                                        onClick={() => router.patch(approve(company.id).url)}
                                    >
                                        Approve
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="rounded-md border border-border/70 px-2 py-1 text-xs hover:bg-muted/60"
                                    onClick={() =>
                                        router.patch(
                                            updateVisibility(company.id).url,
                                            { visibility: company.visibility === 'public' ? 'private' : 'public' },
                                        )
                                    }
                                >
                                    {company.visibility === 'public' ? 'Make Private' : 'Make Public'}
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md border border-red-300/70 px-2 py-1 text-xs text-red-700 hover:bg-red-100/60"
                                    onClick={() => {
                                        if (!window.confirm('Delete this company?')) {
                                            return;
                                        }

                                        router.delete(destroy(company.id).url);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </RecruiterLayout>
    );
}
