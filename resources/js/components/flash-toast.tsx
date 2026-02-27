import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';

type FlashStatusMap = Record<string, string>;

type SharedProps = {
    flash?: {
        status?: string | null;
    };
};

const STATUS_MESSAGES: FlashStatusMap = {
    'candidate-starred': 'Candidate starred.',
    'candidate-unstarred': 'Candidate unstarred.',
    'candidate-status-updated': 'Candidate status updated.',
    'candidate-comment-added': 'Private comment added.',
    'candidate-comment-updated': 'Private comment updated.',
    'candidate-comment-deleted': 'Private comment deleted.',
    'candidate-deleted': 'Candidate deleted.',
    'candidate-added-to-collection': 'Candidate added to collection.',
    'candidate-removed-from-collection': 'Candidate removed from collection.',
    'collection-created': 'Collection created.',
    'collection-updated': 'Collection updated.',
    'collection-deleted': 'Collection deleted.',
};

export function FlashToast() {
    const { flash } = usePage<SharedProps>().props;
    const status = flash?.status ?? null;
    const [visible, setVisible] = useState(false);

    const message = useMemo(() => {
        if (status === null) {
            return null;
        }

        return STATUS_MESSAGES[status] ?? status;
    }, [status]);

    useEffect(() => {
        if (message === null) {
            return;
        }

        setVisible(true);
        const timeout = window.setTimeout(() => setVisible(false), 2500);

        return () => window.clearTimeout(timeout);
    }, [message]);

    if (!visible || message === null) {
        return null;
    }

    const isError = status?.includes('error') ?? false;

    return (
        <div className="fixed right-6 bottom-6 z-50 transition-all duration-300 data-[state=closed]:translate-y-3 data-[state=closed]:opacity-0">
            <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
                    isError
                        ? 'border-red-200 bg-red-50 text-red-900'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
            >
                {isError ? (
                    <CircleAlert className="size-4" />
                ) : message.toLowerCase().includes('updated') ? (
                    <Info className="size-4" />
                ) : (
                    <CheckCircle2 className="size-4" />
                )}
                <span>{message}</span>
            </div>
        </div>
    );
}
