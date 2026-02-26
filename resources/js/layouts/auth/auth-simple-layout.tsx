import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_45%)]" />
            <div className="w-full max-w-md rounded-2xl border border-border/70 bg-background/80 p-8 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.6)] backdrop-blur">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-foreground"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs">
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
