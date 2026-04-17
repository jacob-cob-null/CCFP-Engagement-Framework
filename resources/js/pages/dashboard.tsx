import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';

export default function Dashboard() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Dashboard" />
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-2">Welcome to the CCFP Engagement Framework. Please select an option from the sidebar to continue.</p>
            </div>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
