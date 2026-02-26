import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { edit as editResume, show as showResume } from '@/routes/candidate/resume';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type CandidateResume = {
    id: number;
    original_name: string;
    file_size: number;
    extracted_skills: string[];
    raw_text_preview: string | null;
    created_at: string | null;
};

type CandidateProfile = {
    phone: string | null;
    university: string | null;
    degree: string | null;
    major: string | null;
    graduation_year: number | null;
    location: string | null;
    skills: string[];
};

type PageProps = {
    candidateResume: CandidateResume | null;
    candidateProfile: CandidateProfile | null;
};

export default function Dashboard() {
    const { candidateResume, candidateProfile } = usePage<PageProps>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs lg:col-span-2">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-semibold text-foreground">
                                    Resume
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Keep your resume updated for better matches.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {candidateResume && (
                                    <a
                                        href={showResume(candidateResume.id).url}
                                        className="text-sm font-medium text-primary hover:text-primary/80"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        View
                                    </a>
                                )}
                                <Link
                                    href={editResume().url}
                                    className="text-sm font-medium text-primary hover:text-primary/80"
                                >
                                    {candidateResume ? 'Replace' : 'Upload'}
                                </Link>
                            </div>
                        </div>

                        {candidateResume ? (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">
                                            {candidateResume.original_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {(candidateResume.file_size / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                    {candidateResume.created_at && (
                                        <div className="text-xs text-muted-foreground">
                                            Uploaded {candidateResume.created_at}
                                        </div>
                                    )}
                                </div>

                                {candidateResume.extracted_skills.length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Extracted skills
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {candidateResume.extracted_skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-full border border-muted-foreground/20 bg-muted/40 px-3 py-1 text-xs text-foreground"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {candidateResume.raw_text_preview && (
                                    <div className="rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
                                        {candidateResume.raw_text_preview}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-5 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                No resume uploaded yet.
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs">
                        <div className="text-sm font-semibold text-foreground">
                            Profile snapshot
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Visible to recruiters once your resume is scanned.
                        </p>

                        {candidateProfile ? (
                            <div className="mt-4 space-y-3 text-sm text-foreground">
                                {candidateProfile.university && (
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground">
                                            University
                                        </div>
                                        <div>{candidateProfile.university}</div>
                                    </div>
                                )}

                                {(candidateProfile.degree || candidateProfile.major) && (
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground">
                                            Degree
                                        </div>
                                        <div>
                                            {[candidateProfile.degree, candidateProfile.major]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </div>
                                    </div>
                                )}

                                {candidateProfile.location && (
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground">
                                            Location
                                        </div>
                                        <div>{candidateProfile.location}</div>
                                    </div>
                                )}

                                {candidateProfile.skills.length > 0 && (
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground">
                                            Skills
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {candidateProfile.skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-full border border-muted-foreground/20 bg-muted/40 px-3 py-1 text-xs text-foreground"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                Complete your profile details to show up here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
