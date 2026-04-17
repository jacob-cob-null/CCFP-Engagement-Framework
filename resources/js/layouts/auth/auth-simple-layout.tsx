import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10 bg-slate-50">
            <div className="w-full max-w-sm lg:max-w-md">
                {children}
            </div>
        </div>
    );
}
