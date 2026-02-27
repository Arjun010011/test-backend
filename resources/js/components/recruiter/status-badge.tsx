import { Badge } from '@/components/ui/badge';

type Props = {
    status: string;
    label: string;
};

const STATUS_CLASS: Record<string, string> = {
    new: 'border-slate-300 bg-slate-100 text-slate-700',
    in_review: 'border-blue-300 bg-blue-100 text-blue-700',
    shortlisted: 'border-green-300 bg-green-100 text-green-700',
    rejected: 'border-red-300 bg-red-100 text-red-700',
    hired: 'border-violet-300 bg-violet-100 text-violet-700',
};

export function StatusBadge({ status, label }: Props) {
    return (
        <Badge
            variant="outline"
            className={STATUS_CLASS[status] ?? 'border-slate-300 bg-slate-100 text-slate-700'}
        >
            {label}
        </Badge>
    );
}
