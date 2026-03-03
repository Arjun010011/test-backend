import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12">
            <div className="absolute inset-0 -z-10 bg-blue-200/35 dark:bg-slate-900" />
            <div className="w-full max-w-md rounded-2xl border border-blue-300/70 bg-background/85 p-8 shadow-[0_24px_68px_-46px_rgba(59,130,246,0.55)] backdrop-blur">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-foreground"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300/70 bg-blue-600 text-xs text-white">
                                CP
                            </span>
                            Candidate Portal
                        </Link>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
