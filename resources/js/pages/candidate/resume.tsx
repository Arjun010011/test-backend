import { Form, Head, usePage } from '@inertiajs/react';
import { edit, store } from '@/actions/App/Http/Controllers/Candidate/ResumeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { show as showResume } from '@/routes/candidate/resume';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Resume',
        href: edit().url,
    },
];

type PageProps = {
    latestResume: {
        id: number;
        original_name: string;
        file_size: number;
        extracted_skills: string[] | null;
        created_at: string;
    } | null;
    status?: string;
};

export default function CandidateResume() {
    const { latestResume, status } = usePage<PageProps>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Resume" />

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
                <Heading
                    title="Upload your resume"
                    description="We will scan your resume to extract skills for matching."
                />

                {status === 'resume-uploaded' && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                        Resume uploaded successfully.
                    </div>
                )}

                <Form
                    {...store.form()}
                    encType="multipart/form-data"
                    resetOnSuccess
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="resume">Resume file</Label>
                                <Input
                                    id="resume"
                                    name="resume"
                                    type="file"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Accepted formats: PDF, DOC, DOCX, TXT. Max 5MB.
                                </p>
                                <InputError
                                    className="mt-1"
                                    message={errors.resume}
                                />
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Uploading...' : 'Upload resume'}
                            </Button>
                        </>
                    )}
                </Form>

                {latestResume && (
                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-medium text-foreground">
                                    Latest resume
                                </div>
                                <a
                                    href={showResume(latestResume.id).url}
                                    className="text-xs font-medium text-primary hover:text-primary/80"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View
                                </a>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {latestResume.original_name}
                            </div>
                            {latestResume.extracted_skills &&
                                latestResume.extracted_skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {latestResume.extracted_skills.map(
                                            (skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-full border border-muted-foreground/20 bg-muted/40 px-3 py-1 text-xs text-foreground"
                                                >
                                                    {skill}
                                                </span>
                                            )
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
