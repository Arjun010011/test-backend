import { Head, Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { logout } from '@/routes';
import { dashboard } from '@/routes/company';

type Props = PropsWithChildren<{
    title: string;
}>;

export default function CompanyLayout({ title, children }: Props) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title={title} />
            <div className="mx-auto w-[95vw] max-w-[95vw] py-6">
                <header className="mb-4 flex items-center justify-between rounded-2xl border border-blue-300/40 bg-card/90 px-4 py-3 shadow-[0_14px_36px_-24px_rgba(59,130,246,0.5)] backdrop-blur">
                    <Link href={dashboard().url} className="text-lg font-semibold">
                        Company Console
                    </Link>
                    <Link href={logout()} as="button" method="post" className="text-sm text-muted-foreground hover:text-foreground">
                        Sign out
                    </Link>
                </header>
                {children}
            </div>
        </div>
    );
}
