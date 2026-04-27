import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { UsersSkeleton } from '@/components/skeletons/users-skeleton';
import { EmployeeSkeleton } from '@/components/skeletons/employee-skeleton';
import { AttendanceSkeleton } from '@/components/skeletons/attendance-skeleton';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { AcademicTermsSkeleton } from '@/components/skeletons/academic-terms-skeleton';
import { OrganizationalUnitsSkeleton } from '@/components/skeletons/organizational-units-skeleton';
import { PointPoliciesSkeleton } from '@/components/skeletons/point-policies-skeleton';
import { AuditLogsSkeleton } from '@/components/skeletons/audit-logs-skeleton';
import { SemesterArchiveSkeleton } from '@/components/skeletons/semester-archive-skeleton';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    useEffect(() => {
        const unbindStart = router.on('start', (event) => {
            if (event.detail.visit.method === 'get') {
                setNavigatingTo(event.detail.visit.url.pathname);
            }
        });

        const unbindFinish = router.on('finish', () => {
            setNavigatingTo(null);
        });

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    const renderSkeleton = () => {
        if (!navigatingTo) return null;
        
        if (navigatingTo === '/dashboard' || navigatingTo === '/') {
            return <DashboardSkeleton />;
        }
        
        if (navigatingTo.startsWith('/users')) {
            return <UsersSkeleton />;
        }

        if (navigatingTo.startsWith('/employee')) {
            return <EmployeeSkeleton />;
        }

        if (navigatingTo.startsWith('/attendance')) {
            return <AttendanceSkeleton />;
        }

        if (navigatingTo.startsWith('/academic-terms')) {
            return <AcademicTermsSkeleton />;
        }

        if (navigatingTo.startsWith('/organizational-units')) {
            return <OrganizationalUnitsSkeleton />;
        }

        if (navigatingTo.startsWith('/point-policies')) {
            return <PointPoliciesSkeleton />;
        }

        if (navigatingTo.startsWith('/audit-logs')) {
            return <AuditLogsSkeleton />;
        }

        if (navigatingTo.startsWith('/semester-archive')) {
            return <SemesterArchiveSkeleton />;
        }
        
        return <div className="p-8 bg-[#fafafa] animate-pulse text-slate-400">Loading...</div>;
    };

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden relative">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                
                <div className="relative flex-1 flex flex-col">
                    {navigatingTo ? (
                        renderSkeleton()
                    ) : (
                        <div>{children}</div>
                    )}
                </div>
            </AppContent>
        </AppShell>
    );
}
