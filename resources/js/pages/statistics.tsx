import { Head } from '@inertiajs/react';

export default function Statistics() {
    return (
        <div className="flex flex-col flex-1 p-4 sm:p-8 bg-[#fafafa] min-h-screen">
            <Head title="Statistics" />
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Statistics & Analytics</h1>
                <p className="text-slate-500 mt-4 max-w-2xl text-lg">
                    Monitor real-time engagement data, review historical event records, and generate structural performance reports.
                </p>
            </div>
        </div>
    );
}

Statistics.layout = {
    breadcrumbs: [
        {
            title: 'Statistics',
            href: '/statistics',
        },
    ],
};
