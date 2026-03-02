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

export default function CompanyRecruitmentShow({ recruitment, status }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const editForm = useForm({
        job_role: recruitment.job_role ?? '',
        website: recruitment.website ?? '',
        location: recruitment.location ?? '',
        description: recruitment.description ?? '',
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
                <section className="mt-3 rounded-lg border border-emerald-300/50 bg-emerald-100/50 px-4 py-3 text-sm text-emerald-900">
                    {status.replaceAll('-', ' ')}
                </section>
            )}

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
