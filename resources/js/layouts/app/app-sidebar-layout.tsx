import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    fullWidth = false,
}: AppLayoutProps) {
    const layoutClassName = fullWidth
        ? 'my-0 w-full max-w-none overflow-x-hidden border-0 bg-background shadow-none'
        : 'mx-auto my-3 w-[95vw] max-w-[95vw] overflow-x-hidden rounded-2xl border border-blue-300/30 bg-background shadow-md';

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className={layoutClassName}>
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
