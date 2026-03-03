import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { edit as editOnboarding } from '@/routes/candidate/onboarding';
import { show as showResume } from '@/routes/candidate/resume';
import type { BreadcrumbItem } from '@/types';

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
    is_currently_studying: boolean;
    current_semester: number | null;
    total_semesters: number | null;
    education: {
        is_currently_studying: boolean;
        current_semester: number | null;
        total_semesters: number | null;
        projected_semester: number | null;
        is_completed: boolean;
        status_label: string;
    };
    location: string | null;
    skills: string[];
    skill_categories: Record<string, string[]>;
    achievements: string | null;
    hackathons_experience: string | null;
    projects_description: string | null;
};

type PageProps = {
    candidateResume: CandidateResume | null;
    candidateProfile: CandidateProfile | null;
    status?: string;
};

export default function Dashboard() {
    const { candidateResume, candidateProfile, status } = usePage<PageProps>().props;
    const hasScannedSkills = (candidateResume?.extracted_skills.length ?? 0) > 0;
    const categorizedSkills = Object.entries(
        candidateProfile?.skill_categories ?? {},
    ).filter(([, skills]) => skills.length > 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {status === 'profile-updated' && (
                    <div className="rounded-lg border border-blue-300/70 bg-blue-200/70 px-4 py-3 text-sm text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
                        Profile updated successfully.
                    </div>
                )}

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
                                    href={editOnboarding().url}
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
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-sm font-semibold text-foreground">
                                Profile snapshot
                            </div>
                            <Link
                                href={editOnboarding().url}
                                className="text-sm font-medium text-primary hover:text-primary/80"
                            >
                                Edit profile
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {hasScannedSkills
                                ? 'Visible to recruiters.'
                                : 'Visible to recruiters once your resume is scanned.'}
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

                                <div>
                                    <div className="text-xs uppercase text-muted-foreground">
                                        Education status
                                    </div>
                                    <div>{candidateProfile.education.status_label}</div>
                                </div>

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

                                {categorizedSkills.length > 0 && (
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground">
                                            Skill categories
                                        </div>
                                        <div className="mt-2 space-y-3">
                                            {categorizedSkills.map(
                                                ([category, skills]) => (
                                                    <div key={category}>
                                                        <div className="text-xs font-semibold text-foreground">
                                                            {category}
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {skills.map(
                                                                (skill) => (
                                                                    <span
                                                                        key={`${category}-${skill}`}
                                                                        className="rounded-full border border-muted-foreground/20 bg-muted/40 px-3 py-1 text-xs text-foreground"
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(candidateProfile.achievements ||
                                    candidateProfile.hackathons_experience ||
                                    candidateProfile.projects_description) && (
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground">
                                            Additional experience
                                        </div>
                                        <div className="mt-2 space-y-2 text-sm">
                                            {candidateProfile.achievements && (
                                                <p>
                                                    <span className="font-medium">Achievements:</span>{' '}
                                                    {candidateProfile.achievements}
                                                </p>
                                            )}
                                            {candidateProfile.hackathons_experience && (
                                                <p>
                                                    <span className="font-medium">Hackathons:</span>{' '}
                                                    {candidateProfile.hackathons_experience}
                                                </p>
                                            )}
                                            {candidateProfile.projects_description && (
                                                <p>
                                                    <span className="font-medium">Projects:</span>{' '}
                                                    {candidateProfile.projects_description}
                                                </p>
                                            )}
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
