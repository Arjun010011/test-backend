import { Badge } from '@/components/ui/badge';

type Props = {
    status: string;
    label: string;
    color?: string;
};

const STATUS_CLASS: Record<string, string> = {
    new: 'border-slate-300 bg-slate-100 text-slate-700',
    in_review: 'border-blue-300 bg-blue-100 text-blue-700',
    shortlisted: 'border-green-300 bg-green-100 text-green-700',
    rejected: 'border-red-300 bg-red-100 text-red-700',
    hired: 'border-violet-300 bg-violet-100 text-violet-700',
};

const COLOR_CLASS: Record<string, string> = {
    gray: 'border-slate-300 bg-slate-100 text-slate-700',
    blue: 'border-blue-300 bg-blue-100 text-blue-700',
    green: 'border-green-300 bg-green-100 text-green-700',
    red: 'border-red-300 bg-red-100 text-red-700',
    purple: 'border-violet-300 bg-violet-100 text-violet-700',
    amber: 'border-amber-300 bg-amber-100 text-amber-700',
    cyan: 'border-cyan-300 bg-cyan-100 text-cyan-700',
};

export function StatusBadge({ status, label, color }: Props) {
    const className = color !== undefined
        ? (COLOR_CLASS[color] ?? 'border-slate-300 bg-slate-100 text-slate-700')
        : (STATUS_CLASS[status] ?? 'border-slate-300 bg-slate-100 text-slate-700');

    return (
        <Badge
            variant="outline"
            className={className}
        >
            {label}
        </Badge>
    );
}
