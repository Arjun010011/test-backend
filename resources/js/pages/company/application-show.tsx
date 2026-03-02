import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import CompanyLayout from '@/layouts/company-layout';
import { companyApplicationStatuses } from '@/lib/company-application-statuses';
import { show as showRecruitment } from '@/routes/company/recruitments';
import { update as updateApplication } from '@/routes/company/recruitments/applications';

type Props = {
    company: {
        id: number;
        name: string;
        job_role: string | null;
    };
    application: {
        id: number;
        status: string;
        review_note: string | null;
        applied_at: string | null;
        cover_letter: string | null;
        candidate: {
            id: number | null;
            name: string | null;
            email: string | null;
            location: string | null;
            university: string | null;
            degree: string | null;
            major: string | null;
            graduation_year: string | null;
        };
    };
};

export default function CompanyApplicationShow({ company, application }: Props) {
    const form = useForm({
        status: application.status,
        review_note: application.review_note ?? '',
    });

    return (
        <CompanyLayout title="Candidate Profile">
            <Head title={`Application #${application.id}`} />

            <div className="space-y-4">
                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">{application.candidate.name ?? 'Candidate'}</h2>
                            {application.candidate.email && (
                                <p className="text-sm text-muted-foreground">{application.candidate.email}</p>
                            )}
                            <p className="mt-1 text-sm text-muted-foreground">Company: {company.name}</p>
                            {company.job_role && (
                                <p className="text-sm text-muted-foreground">Role: {company.job_role}</p>
                            )}
                        </div>
                        <Link href={showRecruitment(company.id).url} className="text-sm font-medium text-primary hover:text-primary/80">
                            Back to recruitment
                        </Link>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <div>Applied at: {application.applied_at ?? 'N/A'}</div>
                        {application.candidate.location && <div>Location: {application.candidate.location}</div>}
                        {application.candidate.university && <div>University: {application.candidate.university}</div>}
                        {application.candidate.degree && <div>Degree: {application.candidate.degree}</div>}
                        {application.candidate.major && <div>Major: {application.candidate.major}</div>}
                        {application.candidate.graduation_year && (
                            <div>Graduation year: {application.candidate.graduation_year}</div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h3 className="text-base font-semibold">Cover letter</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                        {application.cover_letter ?? 'No cover letter submitted.'}
                    </p>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <h3 className="text-base font-semibold">Recruitment Status</h3>
                    <div className="mt-3 space-y-2">
                        <select
                            value={form.data.status}
                            onChange={(event) => form.setData('status', event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {companyApplicationStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {status.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.status} />

                        <textarea
                            value={form.data.review_note}
                            onChange={(event) => form.setData('review_note', event.target.value)}
                            rows={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Role-specific note for this candidate"
                        />
                        <InputError message={form.errors.review_note} />

                        <Button
                            type="button"
                            onClick={() =>
                                form.patch(
                                    updateApplication({
                                        company: company.id,
                                        application: application.id,
                                    }).url,
                                )
                            }
                            disabled={form.processing}
                        >
                            {form.processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </section>
            </div>
        </CompanyLayout>
    );
}
