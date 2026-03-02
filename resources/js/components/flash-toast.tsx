import { usePage } from '@inertiajs/react';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type FlashStatusMap = Record<string, string>;

type SharedProps = {
    flash?: {
        status?: string | null;
        message?: string | null;
    };
};

const STATUS_MESSAGES: FlashStatusMap = {
    'candidate-starred': 'Candidate starred.',
    'candidate-unstarred': 'Candidate unstarred.',
    'candidate-status-created': 'Custom status created.',
    'candidate-status-updated': 'Custom status updated.',
    'candidate-status-deleted': 'Custom status deleted.',
    'candidate-status-delete-error-default': 'Default statuses cannot be deleted.',
    'candidate-status-delete-error-in-use': 'Cannot delete a status currently in use.',
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

function FlashToastItem({ status, message }: { status: string; message: string }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timeout = window.setTimeout(() => setVisible(false), 2500);

        return () => window.clearTimeout(timeout);
    }, []);

    if (!visible) {
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

export function FlashToast() {
    const { flash } = usePage<SharedProps>().props;
    const status = flash?.status ?? null;
    const customMessage = flash?.message ?? null;

    const message = useMemo(() => {
        if (customMessage !== null) {
            return customMessage;
        }

        if (status === null) {
            return null;
        }

        return STATUS_MESSAGES[status] ?? status;
    }, [customMessage, status]);

    if (status === null || message === null) {
        return null;
    }

    return <FlashToastItem key={status} status={status} message={message} />;
}
