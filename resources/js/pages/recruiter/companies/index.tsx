import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Eye, EyeOff, Globe, MapPin, Search, ShieldCheck, Users } from 'lucide-react';
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

    const companyStats = useMemo(() => {
        const total = companies.data.length;
        const active = companies.data.filter((company) => company.is_active).length;
        const pending = companies.data.filter((company) => company.approval_status === 'pending').length;
        const applications = companies.data.reduce(
            (carry, company) => carry + company.applications_count,
            0,
        );

        return { total, active, pending, applications };
    }, [companies.data]);

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

                <section className="rounded-3xl border border-border/70 bg-blue-700 p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                                <Building2 className="size-3.5" />
                                Company management
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
                                Manage hiring partners
                            </h1>
                            <p className="mt-2 text-sm text-blue-100">
                                Enroll new companies, track approvals, and monitor application volume across listings.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <p className="text-xs text-blue-100">Companies</p>
                                <p className="mt-1 text-xl font-semibold">{companyStats.total}</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <p className="text-xs text-blue-100">Active</p>
                                <p className="mt-1 text-xl font-semibold">{companyStats.active}</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <p className="text-xs text-blue-100">Pending</p>
                                <p className="mt-1 text-xl font-semibold">{companyStats.pending}</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <p className="text-xs text-blue-100">Applications</p>
                                <p className="mt-1 text-xl font-semibold">{companyStats.applications}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h2 className="text-base font-semibold">Enroll company</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a company profile to make opportunities visible to candidates.
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
                            <Button type="submit" disabled={form.processing} className="bg-blue-700 text-white hover:bg-blue-800">
                                {form.processing ? 'Saving...' : 'Enroll company'}
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h2 className="text-base font-semibold">All registered companies</h2>
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

                {companies.data.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-border/70 bg-card/70 px-6 py-12 text-center">
                        <Building2 className="mx-auto size-8 text-muted-foreground" />
                        <h3 className="mt-3 text-lg font-semibold">No companies found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Try adjusting filters or enroll a new company to get started.
                        </p>
                    </section>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {companies.data.map((company) => (
                        <article
                            key={company.id}
                            className="cursor-pointer rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm transition-colors hover:bg-accent/30"
                            role="link"
                            tabIndex={0}
                            onClick={() => router.get(show(company.id).url)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    router.get(show(company.id).url);
                                }
                            }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold">{company.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full border px-2 py-1 text-xs ${company.is_active ? 'border-emerald-300/70 bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'border-amber-300/70 bg-amber-100/60 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'}`}>
                                        {company.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                    <span className={`rounded-full border px-2 py-1 text-xs ${company.approval_status === 'approved' ? 'border-blue-300/70 bg-blue-100/60 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' : 'border-orange-300/70 bg-orange-100/60 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'}`}>
                                        {company.approval_status}
                                    </span>
                                </div>
                            </div>
                            {company.description && (
                                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{company.description}</p>
                            )}
                            <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                                {company.job_role && <div>Role: {company.job_role}</div>}
                                {company.location && (
                                    <div className="inline-flex items-center gap-1">
                                        <MapPin className="size-3.5" />
                                        Location: {company.location}
                                    </div>
                                )}
                                {company.website && (
                                    <div className="inline-flex items-center gap-1">
                                        <Globe className="size-3.5" />
                                        Website: {company.website}
                                    </div>
                                )}
                                <div className="inline-flex items-center gap-1">
                                    <Users className="size-3.5" />
                                    Applications: {company.applications_count}
                                </div>
                                <div>Visibility: {company.visibility}</div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                    <Search className="size-3.5" />
                                    Open for full details
                                </span>
                                {company.approval_status === 'pending' && (
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-md border border-blue-400/60 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200/60"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            router.patch(approve(company.id).url);
                                        }}
                                    >
                                        <ShieldCheck className="size-3.5" />
                                        Approve
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-xs hover:bg-muted/60"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        router.patch(
                                            updateVisibility(company.id).url,
                                            { visibility: company.visibility === 'public' ? 'private' : 'public' },
                                        );
                                    }}
                                >
                                    {company.visibility === 'public' ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    {company.visibility === 'public' ? 'Make Private' : 'Make Public'}
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md border border-red-300/70 px-2 py-1 text-xs text-red-700 hover:bg-red-100/60"
                                    onClick={(event) => {
                                        event.stopPropagation();
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
