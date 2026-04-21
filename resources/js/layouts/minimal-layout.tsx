import { Link, router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
};

/**
 * Minimal layout for the mobile live attendance page.
 * No sidebar, no breadcrumbs — just a slim top bar and the page content.
 */
export default function MinimalLayout({ children }: Props) {
    function handleLogout() {
        router.post('/logout');
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            {/* Top bar */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-indigo-900">CCFP</span>
                    <span className="text-xs text-slate-400">Live Attendance</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                </button>
            </header>

            {/* Page content */}
            <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
                {children}
            </main>
        </div>
    );
}
