import { Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CompanyLayout from '@/layouts/company-layout';
import { companyApplicationStatuses } from '@/lib/company-application-statuses';
import { dashboard } from '@/routes/company';
import { destroy, update as updateRecruitment } from '@/routes/company/recruitments';
import { show as showApplication, update as updateApplication } from '@/routes/company/recruitments/applications';
import { update as updateVisibility } from '@/routes/company/recruitments/visibility';

type Recruitment = {
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
    approval_status: string;
    visibility: string;
    applications_count: number;
    applications: Array<{
        id: number;
        status: string;
        review_note: string | null;
        applied_at: string | null;
        candidate_id: number | null;
        candidate_name: string | null;
        candidate_email: string | null;
    }>;
};

type Props = {
    recruitment: Recruitment;
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

export default function CompanyRecruitmentShow({ recruitment, status }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const editForm = useForm({
        job_role: recruitment.job_role ?? '',
        website: recruitment.website ?? '',
        location: recruitment.location ?? '',
        description: recruitment.description ?? '',
        salary_min_lpa: recruitment.salary_min_lpa !== null ? String(recruitment.salary_min_lpa) : '',
        salary_max_lpa: recruitment.salary_max_lpa !== null ? String(recruitment.salary_max_lpa) : '',
        experience_min_years: recruitment.experience_min_years !== null ? String(recruitment.experience_min_years) : '',
        experience_max_years: recruitment.experience_max_years !== null ? String(recruitment.experience_max_years) : '',
        employment_type: recruitment.employment_type ?? '',
        work_mode: recruitment.work_mode ?? '',
        openings: recruitment.openings !== null ? String(recruitment.openings) : '',
        skills_required: recruitment.skills_required ?? '',
        application_deadline: recruitment.application_deadline ?? '',
    });

    const filteredApplications = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return recruitment.applications.filter((application) => {
            const matchesStatus = statusFilter === 'all' ? true : application.status === statusFilter;
            const matchesSearch =
                normalizedQuery.length === 0
                    ? true
                    : `${application.candidate_name ?? ''} ${application.candidate_email ?? ''}`
                          .toLowerCase()
                          .includes(normalizedQuery);

            return matchesStatus && matchesSearch;
        });
    }, [recruitment.applications, searchQuery, statusFilter]);

    return (
        <CompanyLayout title="Recruitment Details">
            <section className="flex items-center justify-between rounded-xl border border-border/70 bg-card/90 px-4 py-3">
                <div>
                    <h1 className="text-base font-semibold">{recruitment.name}</h1>
                    {recruitment.job_role && (
                        <p className="text-sm text-muted-foreground">{recruitment.job_role}</p>
                    )}
                </div>
                <Link href={dashboard().url} className="text-sm font-medium text-primary hover:text-primary/80">
                    Back to dashboard
                </Link>
            </section>

            {status && (
                <section className="mt-3 rounded-lg border border-blue-300/50 bg-blue-200/60 px-4 py-3 text-sm text-blue-950">
                    {status.replaceAll('-', ' ')}
                </section>
            )}

            <section className="mt-4 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h2 className="text-base font-semibold">Recruitment Summary</h2>
                <div className="mt-3 grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
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
                    {recruitment.skills_required && <div className="md:col-span-2">Skills: {recruitment.skills_required}</div>}
                </div>
            </section>

            <section className="mt-4 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h2 className="text-base font-semibold">Recruitment Actions</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            router.patch(updateVisibility(recruitment.id).url, {
                                visibility: recruitment.visibility === 'public' ? 'private' : 'public',
                            })
                        }
                    >
                        {recruitment.visibility === 'public' ? 'Make Private' : 'Make Public'}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            if (!window.confirm('Delete this recruitment?')) {
                                return;
                            }

                            router.delete(destroy(recruitment.id).url, {
                                onSuccess: () => router.visit(dashboard().url),
                            });
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </section>

            <section className="mt-4 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h2 className="text-base font-semibold">Edit Recruitment</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Input
                            value={editForm.data.job_role}
                            onChange={(event) => editForm.setData('job_role', event.target.value)}
                            placeholder="Job role"
                        />
                        <InputError message={editForm.errors.job_role} />
                    </div>
                    <div>
                        <Input
                            value={editForm.data.website}
                            onChange={(event) => editForm.setData('website', event.target.value)}
                            placeholder="Website"
                        />
                        <InputError message={editForm.errors.website} />
                    </div>
                    <div>
                        <Input
                            value={editForm.data.location}
                            onChange={(event) => editForm.setData('location', event.target.value)}
                            placeholder="Location"
                        />
                        <InputError message={editForm.errors.location} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.data.salary_min_lpa}
                            onChange={(event) => editForm.setData('salary_min_lpa', event.target.value)}
                            placeholder="Min salary (LPA)"
                        />
                        <InputError message={editForm.errors.salary_min_lpa} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.data.salary_max_lpa}
                            onChange={(event) => editForm.setData('salary_max_lpa', event.target.value)}
                            placeholder="Max salary (LPA)"
                        />
                        <InputError message={editForm.errors.salary_max_lpa} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={editForm.data.experience_min_years}
                            onChange={(event) => editForm.setData('experience_min_years', event.target.value)}
                            placeholder="Min experience (years)"
                        />
                        <InputError message={editForm.errors.experience_min_years} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={editForm.data.experience_max_years}
                            onChange={(event) => editForm.setData('experience_max_years', event.target.value)}
                            placeholder="Max experience (years)"
                        />
                        <InputError message={editForm.errors.experience_max_years} />
                    </div>
                    <div>
                        <select
                            value={editForm.data.employment_type}
                            onChange={(event) => editForm.setData('employment_type', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {employmentTypeOptions.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={editForm.errors.employment_type} />
                    </div>
                    <div>
                        <select
                            value={editForm.data.work_mode}
                            onChange={(event) => editForm.setData('work_mode', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {workModeOptions.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={editForm.errors.work_mode} />
                    </div>
                    <div>
                        <Input
                            type="number"
                            min="1"
                            step="1"
                            value={editForm.data.openings}
                            onChange={(event) => editForm.setData('openings', event.target.value)}
                            placeholder="Openings"
                        />
                        <InputError message={editForm.errors.openings} />
                    </div>
                    <div>
                        <Input
                            type="date"
                            value={editForm.data.application_deadline}
                            onChange={(event) => editForm.setData('application_deadline', event.target.value)}
                            placeholder="Application deadline"
                        />
                        <InputError message={editForm.errors.application_deadline} />
                    </div>
                    <div className="md:col-span-2">
                        <textarea
                            value={editForm.data.skills_required}
                            onChange={(event) => editForm.setData('skills_required', event.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Skills required"
                        />
                        <InputError message={editForm.errors.skills_required} />
                    </div>
                    <div className="md:col-span-2">
                        <textarea
                            value={editForm.data.description}
                            onChange={(event) => editForm.setData('description', event.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Description"
                        />
                        <InputError message={editForm.errors.description} />
                    </div>
                    <div className="md:col-span-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                                editForm.patch(updateRecruitment(recruitment.id).url, {
                                    preserveScroll: true,
                                })
                            }
                            disabled={editForm.processing}
                        >
                            {editForm.processing ? 'Saving...' : 'Save changes'}
                        </Button>
                    </div>
                </div>
            </section>

            <section className="mt-4 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h2 className="text-base font-semibold">Candidates</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by candidate name or email"
                    />
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="all">All statuses</option>
                        {companyApplicationStatuses.map((entry) => (
                            <option key={entry} value={entry}>
                                {entry.replaceAll('_', ' ')}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-3 space-y-2">
                    {filteredApplications.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">
                            No candidates match this search/filter.
                        </p>
                    ) : (
                        filteredApplications.map((application) => (
                            <CandidateRow key={application.id} companyId={recruitment.id} application={application} />
                        ))
                    )}
                </div>
            </section>
        </CompanyLayout>
    );
}

type CandidateRowProps = {
    companyId: number;
    application: Recruitment['applications'][number];
};

function CandidateRow({ companyId, application }: CandidateRowProps) {
    const statusForm = useForm({ status: application.status });

    return (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
            <div className="text-sm font-medium">{application.candidate_name ?? 'Candidate'}</div>
            <div className="text-xs text-muted-foreground">{application.candidate_email ?? 'No email'}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                    href={showApplication({ company: companyId, application: application.id }).url}
                    className="inline-flex items-center rounded-md border border-border/70 px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
                >
                    View profile
                </Link>

                <select
                    value={statusForm.data.status}
                    onChange={(event) => statusForm.setData('status', event.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    {companyApplicationStatuses.map((status) => (
                        <option key={status} value={status}>
                            {status.replaceAll('_', ' ')}
                        </option>
                    ))}
                </select>

                <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                        statusForm.patch(
                            updateApplication({ company: companyId, application: application.id }).url,
                            { preserveScroll: true },
                        )
                    }
                    disabled={statusForm.processing}
                >
                    {statusForm.processing ? 'Updating...' : 'Change status'}
                </Button>
            </div>
            <InputError message={statusForm.errors.status} />
        </div>
    );
}
