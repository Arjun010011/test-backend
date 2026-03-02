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
    visibility: string;
    applications_count: number;
};

type Props = {
    recruitments: { data: Recruitment[] };
    status?: string;
};

export default function CompanyDashboard({ recruitments, status }: Props) {
    const form = useForm({
        job_role: '',
        website: '',
        location: '',
        description: '',
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
            <section className="rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-indigo-500/15 px-4 py-3 text-sm">
                Click any job tag to open its full page with actions, filters, and candidate management.
            </section>

            {status && (
                <section className="mt-3 rounded-lg border border-emerald-300/50 bg-emerald-100/50 px-4 py-3 text-sm text-emerald-900">
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
                        <div className="mt-3 text-xs text-muted-foreground">
                            Visibility: {recruitment.visibility}
                        </div>
                    </Link>
                ))}
            </section>
        </CompanyLayout>
    );
}
