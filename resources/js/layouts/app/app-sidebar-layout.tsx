import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        // Trigger skeleton immediately on GET requests
        const unbindStart = router.on('start', (event) => {
            if (event.detail.visit.method === 'get') {
                setIsNavigating(true);
            }
        });

        // Hide skeleton when the visit finishes (successfully or with error)
        const unbindFinish = router.on('finish', () => {
            setIsNavigating(false);
        });

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden relative">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                
                {/* Immediate Navigation Skeleton Overlay */}
                {isNavigating && (
                    <div className="absolute inset-0 z-50 bg-[#fafafa] p-8 animate-in fade-in duration-200">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
                                <div className="h-4 w-96 animate-pulse rounded bg-slate-100" />
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="space-y-4">
                                    <div className="h-10 w-full animate-pulse rounded bg-slate-50" />
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
                                            <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
                                            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={isNavigating ? 'invisible' : 'visible'}>
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
