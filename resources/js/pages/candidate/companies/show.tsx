import { Head, Link, useForm } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CalendarDays,
    CircleDollarSign,
    Globe,
    MapPin,
    Users2,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
    company: Company;
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

export default function CandidateCompanyShow({ company, status }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Companies',
            href: index().url,
        },
        {
            title: company.name,
            href: '#',
        },
    ];

    const form = useForm({
        cover_letter: '',
    });
    const [applicationStep, setApplicationStep] = useState<1 | 2>(1);
    const [hasReviewedDetails, setHasReviewedDetails] = useState(false);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(apply(company.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('cover_letter');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={company.name} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-3 py-4 sm:px-4">
                <section className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-heading text-xl font-bold">
                            {company.name}
                        </h1>
                        {company.job_role && (
                            <p className="text-base font-semibold text-card-foreground">
                                {company.job_role}
                            </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {humanize(company.employment_type) && (
                                <Badge variant="secondary">
                                    {humanize(company.employment_type)}
                                </Badge>
                            )}
                            {humanize(company.work_mode) && (
                                <Badge
                                    variant="outline"
                                    className="text-primary-dark border-primary/30 bg-primary/10"
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
                    </div>
                    <Link
                        href={index().url}
                        className="text-sm font-semibold text-primary hover:text-primary/80"
                    >
                        Back to companies
                    </Link>
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

                <section className="rounded-2xl border border-primary/20 bg-card p-5">
                    <h2 className="text-heading text-base font-bold">
                        Role details
                    </h2>

                    {company.description && (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {company.description}
                        </p>
                    )}

                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        {company.location && (
                            <div className="flex items-center gap-2 rounded-lg bg-secondary/45 px-3 py-2">
                                <MapPin className="size-4 text-primary" />
                                <span>{company.location}</span>
                            </div>
                        )}
                        {formatSalary(
                            company.salary_min_lpa,
                            company.salary_max_lpa,
                        ) && (
                            <div className="flex items-center gap-2 rounded-lg bg-secondary/45 px-3 py-2">
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
                            <div className="flex items-center gap-2 rounded-lg bg-secondary/45 px-3 py-2">
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
                            <div className="flex items-center gap-2 rounded-lg bg-secondary/45 px-3 py-2">
                                <Users2 className="size-4 text-primary" />
                                <span>{company.openings} openings</span>
                            </div>
                        )}
                        {company.application_deadline && (
                            <div className="flex items-center gap-2 rounded-lg bg-secondary/45 px-3 py-2">
                                <CalendarDays className="size-4 text-primary" />
                                <span>
                                    Apply by {company.application_deadline}
                                </span>
                            </div>
                        )}
                        {company.skills_required && (
                            <div className="sm:col-span-2">
                                <span className="font-semibold text-card-foreground">
                                    Skills:
                                </span>{' '}
                                {company.skills_required}
                            </div>
                        )}
                        <div className="sm:col-span-2">
                            <span className="font-semibold text-card-foreground">
                                Applications:
                            </span>{' '}
                            {company.applications_count}
                        </div>
                        {company.website && (
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold break-all text-primary hover:text-primary/80 sm:col-span-2"
                            >
                                <Globe className="size-4" />
                                {company.website}
                            </a>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-primary/20 bg-card p-5">
                    <h2 className="text-heading text-base font-bold">
                        Apply to this role
                    </h2>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                                applicationStep === 1
                                    ? 'bg-primary text-white'
                                    : 'bg-secondary text-secondary-foreground'
                            }`}
                            onClick={() => setApplicationStep(1)}
                        >
                            Step 1: Review
                        </button>
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                                applicationStep === 2
                                    ? 'bg-primary text-white'
                                    : 'bg-secondary text-secondary-foreground'
                            }`}
                            onClick={() => {
                                if (hasReviewedDetails || company.has_applied) {
                                    setApplicationStep(2);
                                }
                            }}
                        >
                            Step 2: Submit
                        </button>
                    </div>

                    {applicationStep === 1 && (
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="rounded-lg border border-border/70 bg-background/60 px-4 py-3 text-muted-foreground">
                                Review role, location, compensation, and
                                required skills before applying.
                            </div>
                            <label className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 rounded border-input accent-[var(--color-primary)]"
                                    checked={hasReviewedDetails}
                                    onChange={(event) =>
                                        setHasReviewedDetails(
                                            event.target.checked,
                                        )
                                    }
                                    disabled={company.has_applied}
                                />
                                <span className="text-muted-foreground">
                                    I have reviewed the role details and want to
                                    continue.
                                </span>
                            </label>
                            <Button
                                type="button"
                                onClick={() => setApplicationStep(2)}
                                disabled={
                                    !hasReviewedDetails || company.has_applied
                                }
                            >
                                Continue to application
                            </Button>
                        </div>
                    )}

                    {applicationStep === 2 && (
                        <form onSubmit={submit} className="mt-4 space-y-3">
                            <label
                                htmlFor="cover-letter"
                                className="text-sm font-semibold text-card-foreground"
                            >
                                Cover letter
                            </label>
                            <textarea
                                id="cover-letter"
                                value={form.data.cover_letter}
                                onChange={(event) =>
                                    form.setData(
                                        'cover_letter',
                                        event.target.value,
                                    )
                                }
                                rows={5}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                placeholder="Briefly explain your relevant experience, strengths, and why this role is a fit."
                                disabled={company.has_applied}
                            />
                            <div className="text-xs text-muted-foreground">
                                {form.data.cover_letter.length}/1200 characters
                            </div>
                            <InputError message={form.errors.cover_letter} />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setApplicationStep(1)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        company.has_applied || form.processing
                                    }
                                >
                                    {company.has_applied
                                        ? 'Applied'
                                        : 'Submit application'}
                                </Button>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
