import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { apply, index } from '@/routes/candidate/companies';
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

export default function CandidateCompaniesIndex({ companies, status }: Props) {
    const form = useForm({
        company_id: null as number | null,
        cover_letter: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>, companyId: number) => {
        event.preventDefault();

        form.setData('company_id', companyId);
        form.post(apply(companyId).url, {
            preserveScroll: true,
            onSuccess: () => {
                form.setData('cover_letter', '');
                form.setData('company_id', null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Companies" />

            <div className="mx-auto flex w-[95vw] max-w-[95vw] flex-col gap-6 p-4">
                <section className="rounded-xl border border-blue-300/40 bg-blue-200/70 px-4 py-3 text-sm text-foreground dark:border-blue-400/20 dark:bg-blue-950/30">
                    Browse enrolled companies and apply directly from your profile.
                </section>

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
                    {companies.data.map((company) => (
                        <article
                            key={company.id}
                            className="rounded-xl border border-border/70 bg-card p-5 shadow-xs"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-base font-semibold">{company.name}</h2>
                                <span className="rounded-full border border-border/70 px-2 py-1 text-xs text-muted-foreground">
                                    {company.applications_count} applications
                                </span>
                            </div>
                            {company.job_role && (
                                <p className="mt-1 text-sm text-muted-foreground">Role: {company.job_role}</p>
                            )}

                            {company.description && (
                                <p className="mt-2 text-sm text-muted-foreground">{company.description}</p>
                            )}

                            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
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
                                {company.application_deadline && <div>Apply by: {company.application_deadline}</div>}
                                {company.skills_required && <div>Skills: {company.skills_required}</div>}
                                {company.website && (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:text-primary/80"
                                    >
                                        {company.website}
                                    </a>
                                )}
                            </div>

                            <form onSubmit={(event) => submit(event, company.id)} className="mt-4 space-y-3">
                                <textarea
                                    value={form.data.company_id === company.id ? form.data.cover_letter : ''}
                                    onChange={(event) => {
                                        form.setData('company_id', company.id);
                                        form.setData('cover_letter', event.target.value);
                                    }}
                                    rows={3}
                                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    placeholder="Optional cover letter"
                                    disabled={company.has_applied}
                                />
                                {form.data.company_id === company.id && (
                                    <InputError message={form.errors.cover_letter} />
                                )}
                                <Button type="submit" disabled={company.has_applied || form.processing}>
                                    {company.has_applied ? 'Applied' : 'Apply now'}
                                </Button>
                            </form>
                        </article>
                    ))}
                </section>
            </div>
        </AppLayout>
    );
}
