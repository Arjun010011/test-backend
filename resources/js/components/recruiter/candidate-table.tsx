import { Link } from '@inertiajs/react';
import { MoreVertical, Star } from 'lucide-react';
import { StatusBadge } from '@/components/recruiter/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { show } from '@/routes/recruiter/candidates';

export type RecruiterCandidate = {
    id: number;
    name: string;
    email: string;
    skills: string[];
    status: string;
    status_label: string;
    status_color: string;
    is_starred: boolean;
    profile_photo_url?: string | null;
    latest_resume: {
        download_url: string;
    } | null;
};

type Props = {
    candidates: RecruiterCandidate[];
    loading?: boolean;
    onToggleStar: (candidateId: number) => void;
    skillSearchTerm?: string;
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function visibleSkills(skills: string[], skillSearchTerm?: string): string[] {
    const search = (skillSearchTerm ?? '').trim().toLowerCase();

    if (search === '') {
        return skills.slice(0, 2);
    }

    const matchedSkill = skills.find((skill) => skill.toLowerCase().includes(search));

    if (matchedSkill === undefined) {
        return skills.slice(0, 2);
    }

    return [matchedSkill, ...skills.filter((skill) => skill !== matchedSkill)].slice(0, 2);
}

export function CandidateTable({
    candidates,
    loading = false,
    onToggleStar,
    skillSearchTerm,
}: Props) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (candidates.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card px-6 py-12 text-center shadow-sm">
                <PlaceholderPattern className="absolute inset-0 size-full stroke-muted/30" />
                <div className="relative mx-auto max-w-md">
                    <h3 className="text-lg font-semibold text-foreground">No candidates found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Try changing filters, status, or search keywords to discover matching profiles.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="max-h-[70vh] overflow-auto">
                <table className="w-full table-auto">
                    <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                        <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3">Candidate</th>
                            <th className="px-4 py-3">Skills</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Star</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map((candidate) => (
                            <tr
                                key={candidate.id}
                                className="border-b border-border/40 text-sm transition-colors hover:bg-muted/20"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-border/70">
                                            <AvatarImage
                                                src={candidate.profile_photo_url ?? undefined}
                                                alt={candidate.name}
                                            />
                                            <AvatarFallback className="text-xs font-semibold">
                                                {initials(candidate.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-foreground">{candidate.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {candidate.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {visibleSkills(candidate.skills, skillSearchTerm).map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge
                                        status={candidate.status}
                                        label={candidate.status_label}
                                        color={candidate.status_color}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => onToggleStar(candidate.id)}
                                        className="inline-flex rounded-full p-1 transition-colors hover:bg-blue-200/80"
                                    >
                                        <Star
                                            className={cn(
                                                'size-4',
                                                candidate.is_starred
                                                    ? 'fill-blue-400 text-blue-500'
                                                    : 'text-muted-foreground',
                                            )}
                                        />
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={show(candidate.id).url}>View profile</Link>
                                            </DropdownMenuItem>
                                            {candidate.latest_resume && (
                                                <DropdownMenuItem asChild>
                                                    <a
                                                        href={candidate.latest_resume.download_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Download resume
                                                    </a>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
