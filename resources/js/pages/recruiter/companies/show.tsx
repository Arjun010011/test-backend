import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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

export default function RecruiterCompanyShow({ company, applications }: Props) {
    return (
        <RecruiterLayout title={`${company.name} Applications`}>
            <Head title={`${company.name} Applications`} />

            <div className="space-y-4">
                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">{company.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {company.is_active ? 'Visible to candidates' : 'Hidden from candidates'}
                            </p>
                        </div>
                        <Link href={companiesIndex().url} className="text-sm font-medium text-primary hover:text-primary/80">
                            Back to companies
                        </Link>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                        {company.job_role && <div>Role: {company.job_role}</div>}
                        {formatSalary(company.salary_min_lpa, company.salary_max_lpa) && (
                            <div>Salary: {formatSalary(company.salary_min_lpa, company.salary_max_lpa)}</div>
                        )}
                        {formatExperience(company.experience_min_years, company.experience_max_years) && (
                            <div>Experience: {formatExperience(company.experience_min_years, company.experience_max_years)}</div>
                        )}
                        {humanize(company.employment_type) && <div>Type: {humanize(company.employment_type)}</div>}
                        {humanize(company.work_mode) && <div>Mode: {humanize(company.work_mode)}</div>}
                        {company.openings !== null && <div>Openings: {company.openings}</div>}
                        {company.application_deadline && <div>Deadline: {company.application_deadline}</div>}
                        {company.skills_required && <div>Skills: {company.skills_required}</div>}
                        {company.location && <div>Location: {company.location}</div>}
                        {company.website && <div>Website: {company.website}</div>}
                        <div>Source: {company.source}</div>
                        <div>Approval: {company.approval_status}</div>
                        <div>Visibility: {company.visibility}</div>
                        {company.created_by_name && <div>Enrolled by: {company.created_by_name}</div>}
                        {company.owner_name && <div>Company owner: {company.owner_name}</div>}
                        {company.description && <p className="pt-1">{company.description}</p>}
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h3 className="text-base font-semibold">Applications</h3>
                    {applications.data.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">No student applications yet.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {applications.data.map((application) => (
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
        <article className="rounded-xl border border-border/70 bg-background/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-medium">
                        {application.candidate.name ?? 'Unknown candidate'}
                    </div>
                    {application.candidate.email && (
                        <div className="text-xs text-muted-foreground">{application.candidate.email}</div>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">
                    {application.applied_at ? `Applied ${application.applied_at}` : 'Applied recently'}
                </div>
            </div>
            {application.cover_letter_preview && (
                <p className="mt-3 text-sm text-muted-foreground">{application.cover_letter_preview}</p>
            )}

            <div className="mt-3 space-y-2">
                <select
                    value={reviewForm.data.status}
                    onChange={(event) => reviewForm.setData('status', event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    {companyApplicationStatuses.map((status) => (
                        <option key={status} value={status}>
                            {status.replaceAll('_', ' ')}
                        </option>
                    ))}
                </select>
                <InputError message={reviewForm.errors.status} />
                <textarea
                    value={reviewForm.data.review_note}
                    onChange={(event) => reviewForm.setData('review_note', event.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Recruiter/company note for this role"
                />
                <InputError message={reviewForm.errors.review_note} />
            </div>

            <div className="mt-3 flex items-center justify-between">
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
                    disabled={reviewForm.processing}
                >
                    {reviewForm.processing ? 'Saving...' : 'Save review'}
                </Button>
                <Link
                    href={showApplication({ company: companyId, application: application.id }).url}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                >
                    View details
                </Link>
            </div>
        </article>
    );
}
