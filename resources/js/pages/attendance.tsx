import { Head } from '@inertiajs/react';

export default function Attendance() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Attendance" />
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
                <p className="text-slate-500 mt-4 max-w-2xl text-lg">
                    Manage and track participant attendance, check-ins, and engagement activity across all registered events.
                </p>
            </div>
        </div>
    );
}

Attendance.layout = {
    breadcrumbs: [
        {
            title: 'Attendance',
            href: '/attendance',
        },
    ],
};
