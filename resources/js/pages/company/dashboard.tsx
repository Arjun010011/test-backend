import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CompanyLayout from '@/layouts/company-layout';
import { show, store } from '@/routes/company/recruitments';

type Recruitment = {
    id: number;
    name: string;
    job_role: string | null;
    description: string | null;
    salary_min_lpa: number | null;
    salary_max_lpa: number | null;
    experience_min_years: number | null;
    experience_max_years: number | null;
    employment_type: string | null;
    work_mode: string | null;
    openings: number | null;
    application_deadline: string | null;
    visibility: string;
    applications_count: number;
};

type Props = {
    recruitments: { data: Recruitment[] };
    status?: string;
};

const employmentTypeOptions = [
    { value: '', label: 'Select employment type' },
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
];

const workModeOptions = [
    { value: '', label: 'Select work mode' },
    { value: 'on_site', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote' },
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

export default function CompanyDashboard({ recruitments, status }: Props) {
    const form = useForm({
        job_role: '',
        website: '',
        location: '',
        description: '',
        salary_min_lpa: '',
        salary_max_lpa: '',
        experience_min_years: '',
        experience_max_years: '',
        employment_type: '',
        work_mode: '',
        openings: '',
        skills_required: '',
        application_deadline: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <CompanyLayout title="Company Dashboard">
            <section className="rounded-xl border border-blue-300/40 bg-blue-200/70 px-4 py-3 text-sm dark:bg-blue-950/30">
                Click any job tag to open its full page with actions, filters, and candidate management.
            </section>

            {status && (
                <section className="mt-3 rounded-lg border border-blue-300/50 bg-blue-200/60 px-4 py-3 text-sm text-blue-950">
                    {status.replaceAll('-', ' ')}
                </section>
            )}

            <section className="mt-4 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h2 className="text-base font-semibold">Create Recruitment</h2>
                <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Input
                            value={form.data.job_role}
                            onChange={(event) => form.setData('job_role', event.target.value)}
                            placeholder="Job role (e.g. Backend Engineer Intern)"
                        />
                        <InputError message={form.errors.job_role} />
                    </div>
                    <div>
                        <Input
                            value={form.data.website}
                            onChange={(event) => form.setData('website', event.target.value)}
                            placeholder="Website"
                        />
                        <InputError message={form.errors.website} />
                    </div>
                    <div>
                        <Input
                            value={form.data.location}
                            onChange={(event) => form.setData('location', event.target.value)}
                            placeholder="Location"
                        />
                        <InputError message={form.errors.location} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.salary_min_lpa}
                            onChange={(event) => form.setData('salary_min_lpa', event.target.value)}
                            placeholder="Min salary (LPA)"
                        />
                        <InputError message={form.errors.salary_min_lpa} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.salary_max_lpa}
                            onChange={(event) => form.setData('salary_max_lpa', event.target.value)}
                            placeholder="Max salary (LPA)"
                        />
                        <InputError message={form.errors.salary_max_lpa} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={form.data.experience_min_years}
                            onChange={(event) => form.setData('experience_min_years', event.target.value)}
                            placeholder="Min experience (years)"
                        />
                        <InputError message={form.errors.experience_min_years} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={form.data.experience_max_years}
                            onChange={(event) => form.setData('experience_max_years', event.target.value)}
                            placeholder="Max experience (years)"
                        />
                        <InputError message={form.errors.experience_max_years} />
                    </div>
                    <div>
                        <select
                            value={form.data.employment_type}
                            onChange={(event) => form.setData('employment_type', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {employmentTypeOptions.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.employment_type} />
                    </div>
                    <div>
                        <select
                            value={form.data.work_mode}
                            onChange={(event) => form.setData('work_mode', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {workModeOptions.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.work_mode} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="1"
                            step="1"
                            value={form.data.openings}
                            onChange={(event) => form.setData('openings', event.target.value)}
                            placeholder="Openings"
                        />
                        <InputError message={form.errors.openings} />
                    </div>
                    <div>
                        <Input
                            type="date"
                            value={form.data.application_deadline}
                            onChange={(event) => form.setData('application_deadline', event.target.value)}
                            placeholder="Application deadline"
                        />
                        <InputError message={form.errors.application_deadline} />
                    </div>
                    <div className="md:col-span-2">
                        <textarea
                            value={form.data.skills_required}
                            onChange={(event) => form.setData('skills_required', event.target.value)}
                            rows={2}
                            placeholder="Skills required (e.g. Laravel, React, SQL)"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <InputError message={form.errors.skills_required} />
                    </div>
                    <div className="md:col-span-2">
                        <textarea
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            rows={3}
                            placeholder="Recruitment description"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <InputError message={form.errors.description} />
                    </div>
                    <div className="md:col-span-2">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Creating...' : 'Create recruitment'}
                        </Button>
                    </div>
                </form>
            </section>

            <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recruitments.data.map((recruitment) => (
                    <Link
                        key={recruitment.id}
                        href={show(recruitment.id).url}
                        className="block rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm transition hover:bg-muted/40"
                    >
                        <div className="flex items-start justify-between gap-2">
                            {recruitment.job_role && (
                                <h3 className="text-sm font-semibold">{recruitment.job_role}</h3>
                            )}
                            <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs">
                                {recruitment.applications_count}
                            </span>
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                            {recruitment.description ?? 'No job description added yet.'}
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            {formatSalary(recruitment.salary_min_lpa, recruitment.salary_max_lpa) && (
                                <div>Salary: {formatSalary(recruitment.salary_min_lpa, recruitment.salary_max_lpa)}</div>
                            )}
                            {formatExperience(recruitment.experience_min_years, recruitment.experience_max_years) && (
                                <div>Experience: {formatExperience(recruitment.experience_min_years, recruitment.experience_max_years)}</div>
                            )}
                            {humanize(recruitment.employment_type) && <div>Type: {humanize(recruitment.employment_type)}</div>}
                            {humanize(recruitment.work_mode) && <div>Mode: {humanize(recruitment.work_mode)}</div>}
                            {recruitment.openings !== null && <div>Openings: {recruitment.openings}</div>}
                            {recruitment.application_deadline && <div>Deadline: {recruitment.application_deadline}</div>}
                            <div>Visibility: {recruitment.visibility}</div>
                        </div>
                    </Link>
                ))}
            </section>
        </CompanyLayout>
    );
}
