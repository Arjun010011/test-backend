import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { show as showAssessment } from '@/routes/recruiter/assessments';
import { store } from '@/routes/recruiter/assessments/assign';

type Assignment = {
    id: number;
    college_name: string;
    starts_at: string | null;
    ends_at: string | null;
    max_attempts: number;
    is_active: boolean;
};

type Props = {
    assessment: {
        id: number;
        title: string;
        category: string;
        difficulty: string;
        assignments: Assignment[];
    };
};

export default function RecruiterAssessmentsCreateAssignment({ assessment }: Props) {
    const form = useForm({
        college_name: '',
        starts_at: '',
        ends_at: '',
        max_attempts: 1,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(store({ assessment: assessment.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('college_name', 'starts_at', 'ends_at');
                form.setData('max_attempts', 1);
            },
        });
    };

    return (
        <RecruiterLayout title="Assign Assessment">
            <Head title="Assign Assessment" />

            <div className="space-y-5">
                <section className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Assign {assessment.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Candidate visibility is controlled by these assignment rules. Add college, timing window, and
                        attempt limit.
                    </p>

                    <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="college_name" className="text-sm font-medium">
                                College name
                            </label>
                            <Input
                                id="college_name"
                                value={form.data.college_name}
                                onChange={(event) => form.setData('college_name', event.target.value)}
                                placeholder="ABC Engineering College"
                            />
                            <InputError message={form.errors.college_name} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="starts_at" className="text-sm font-medium">
                                Start at
                            </label>
                            <Input
                                id="starts_at"
                                type="datetime-local"
                                value={form.data.starts_at}
                                onChange={(event) => form.setData('starts_at', event.target.value)}
                            />
                            <InputError message={form.errors.starts_at} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="ends_at" className="text-sm font-medium">
                                End at
                            </label>
                            <Input
                                id="ends_at"
                                type="datetime-local"
                                value={form.data.ends_at}
                                onChange={(event) => form.setData('ends_at', event.target.value)}
                            />
                            <InputError message={form.errors.ends_at} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="max_attempts" className="text-sm font-medium">
                                Max attempts per candidate
                            </label>
                            <Input
                                id="max_attempts"
                                type="number"
                                min={1}
                                max={5}
                                value={form.data.max_attempts}
                                onChange={(event) => form.setData('max_attempts', Number(event.target.value))}
                            />
                            <InputError message={form.errors.max_attempts} />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Assigning...' : 'Create Assignment'}
                            </Button>
                            <Button variant="outline" type="button" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold">Existing assignments</h3>
                        <Button asChild variant="outline" size="sm">
                            <a href={showAssessment({ assessment: assessment.id }).url}>Back to assessment</a>
                        </Button>
                    </div>

                    {assessment.assignments.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                            No assignment rules created yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {assessment.assignments.map((assignment) => (
                                <article
                                    key={assignment.id}
                                    className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-medium">{assignment.college_name}</p>
                                        <span className="rounded-full border border-border/70 px-2 py-1 text-xs">
                                            {assignment.is_active ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                                        <p>Starts: {assignment.starts_at ?? 'Immediately'}</p>
                                        <p>Ends: {assignment.ends_at ?? 'No deadline'}</p>
                                        <p>Max attempts: {assignment.max_attempts}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </RecruiterLayout>
    );
}
