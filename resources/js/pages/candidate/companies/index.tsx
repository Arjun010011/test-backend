import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BriefcaseBusiness,
    CalendarDays,
    CircleDollarSign,
    Globe,
    MapPin,
    Users2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { index, show } from '@/routes/candidate/companies';
import type { BreadcrumbItem } from '@/types';

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
    applications_count: number;
    has_applied: boolean;
};

type Props = {
    companies: { data: Company[] };
    filters: {
        search: string;
    };
    status?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Companies',
        href: index().url,
    },
];

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

function formatExperience(
    min: number | null,
    max: number | null,
): string | null {
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

export default function CandidateCompaniesIndex({
    companies,
    filters,
    status,
}: Props) {
    const searchForm = useForm({
        search: filters.search ?? '',
    });

    const searchCompanies = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        searchForm.get(index().url, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Companies" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-4 sm:px-4">
                <section className="rounded-xl border border-blue-300/40 bg-blue-200/70 px-4 py-3 text-sm text-foreground dark:border-blue-400/20 dark:bg-blue-950/30">
                    Browse enrolled companies and apply directly from your
                    profile.
                </section>

                <form
                    onSubmit={searchCompanies}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                    <div className="min-w-0">
                        <label
                            htmlFor="company-search"
                            className="mb-1 block text-sm font-medium"
                        >
                            Search companies or roles
                        </label>
                        <Input
                            id="company-search"
                            value={searchForm.data.search}
                            onChange={(event) =>
                                searchForm.setData('search', event.target.value)
                            }
                            placeholder="Try: Acme or Backend Engineer"
                        />
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto sm:self-end">
                        <Button
                            type="submit"
                            disabled={searchForm.processing}
                            className="w-full sm:w-auto"
                        >
                            Search
                        </Button>
                        {filters.search && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    searchForm.setData('search', '');
                                    searchForm.get(index().url, {
                                        preserveScroll: true,
                                        preserveState: true,
                                        replace: true,
                                    });
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </form>

                {status === 'company-application-submitted' && (
                    <div className="rounded-lg border border-blue-300/70 bg-blue-200/70 px-4 py-3 text-sm text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
                        Application submitted successfully.
                    </div>
                )}

                {status === 'company-application-exists' && (
                    <div className="rounded-lg border border-blue-300/70 bg-blue-200/70 px-4 py-3 text-sm text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
                        You have already applied to this company.
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-2">
                    {companies.data.length === 0 && (
                        <article className="rounded-xl border border-border/70 bg-card p-5 text-sm text-muted-foreground md:col-span-2">
                            No companies found for this search.
                        </article>
                    )}

                    {companies.data.map((company) => (
                        <article
                            key={company.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`View ${company.name} details`}
                            onClick={() => router.visit(show(company.id).url)}
                            onKeyDown={(event) => {
                                if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                ) {
                                    event.preventDefault();
                                    router.visit(show(company.id).url);
                                }
                            }}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-primary/25 bg-card p-4 transition-colors duration-200 hover:border-primary/50 sm:p-5"
                        >
                            <div className="absolute top-0 left-0 h-full w-1 bg-primary/80" />

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-heading text-base font-bold break-words">
                                        {company.name}
                                    </h2>
                                    {company.job_role && (
                                        <p className="mt-1 text-lg font-semibold text-pretty text-card-foreground">
                                            {company.job_role}
                                        </p>
                                    )}
                                </div>
                                <span className="text-primary-dark rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold">
                                    {company.applications_count} applications
                                </span>
                            </div>

                            {company.description && (
                                <p className="mt-3 text-sm leading-6 break-words text-muted-foreground">
                                    {company.description}
                                </p>
                            )}

                            <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                {company.location && (
                                    <div className="flex items-center gap-2 rounded-lg bg-background/75 px-3 py-2">
                                        <MapPin className="size-4 text-primary" />
                                        <span>{company.location}</span>
                                    </div>
                                )}
                                {formatSalary(
                                    company.salary_min_lpa,
                                    company.salary_max_lpa,
                                ) && (
                                    <div className="flex items-center gap-2 rounded-lg bg-background/75 px-3 py-2">
                                        <CircleDollarSign className="size-4 text-primary" />
                                        <span>
                                            {formatSalary(
                                                company.salary_min_lpa,
                                                company.salary_max_lpa,
                                            )}
                                        </span>
                                    </div>
                                )}
                                {formatExperience(
                                    company.experience_min_years,
                                    company.experience_max_years,
                                ) && (
                                    <div className="flex items-center gap-2 rounded-lg bg-background/75 px-3 py-2">
                                        <BriefcaseBusiness className="size-4 text-primary" />
                                        <span>
                                            {formatExperience(
                                                company.experience_min_years,
                                                company.experience_max_years,
                                            )}
                                        </span>
                                    </div>
                                )}
                                {company.openings !== null && (
                                    <div className="flex items-center gap-2 rounded-lg bg-background/75 px-3 py-2">
                                        <Users2 className="size-4 text-primary" />
                                        <span>{company.openings} openings</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {humanize(company.employment_type) && (
                                    <Badge
                                        variant="secondary"
                                        className="font-semibold text-secondary-foreground"
                                    >
                                        {humanize(company.employment_type)}
                                    </Badge>
                                )}
                                {humanize(company.work_mode) && (
                                    <Badge
                                        variant="outline"
                                        className="text-primary-dark border-primary/25 bg-primary/8 font-semibold"
                                    >
                                        {humanize(company.work_mode)}
                                    </Badge>
                                )}
                                {company.has_applied && (
                                    <Badge className="bg-emerald-600 text-white">
                                        Applied
                                    </Badge>
                                )}
                            </div>

                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                {company.application_deadline && (
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="size-4 text-primary" />
                                        <span>
                                            Apply by{' '}
                                            {company.application_deadline}
                                        </span>
                                    </div>
                                )}
                                {company.skills_required && (
                                    <p>
                                        <span className="font-semibold text-card-foreground">
                                            Key skills:
                                        </span>{' '}
                                        {company.skills_required}
                                    </p>
                                )}
                                {company.website && (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                        className="inline-flex items-center gap-1 font-medium break-all text-primary underline-offset-4 hover:underline"
                                    >
                                        <Globe className="size-4" />
                                        {company.website}
                                    </a>
                                )}
                            </div>

                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition group-hover:translate-x-0.5">
                                View details and apply
                                <ArrowRight className="size-4" />
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </AppLayout>
    );
}
