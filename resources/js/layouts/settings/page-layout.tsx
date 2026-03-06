import { usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLayout from '@/layouts/app-layout';
import CompanyLayout from '@/layouts/company-layout';
import RecruiterLayout from '@/layouts/recruiter-layout';
import type { BreadcrumbItem } from '@/types';

type SharedProps = {
    auth: {
        user: {
            role?: unknown;
        };
    };
};

type Props = PropsWithChildren<{
    title: string;
    breadcrumbs: BreadcrumbItem[];
}>;

export default function SettingsPageLayout({ title, breadcrumbs, children }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const role = auth?.user?.role;

    if (role === 'admin' || role === 'super_admin') {
        return <RecruiterLayout title={title}>{children}</RecruiterLayout>;
    }

    if (role === 'company') {
        return <CompanyLayout title={title}>{children}</CompanyLayout>;
    }

    return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
}
