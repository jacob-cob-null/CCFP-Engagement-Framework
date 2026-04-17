import { Head } from '@inertiajs/react';

export default function Employee() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Employee Directory" />
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h1>
                <p className="text-slate-500 mt-4 max-w-2xl text-lg">
                    View staff profiles, manage permissions, and assign internal roles for upcoming events and programs.
                </p>
            </div>
        </div>
    );
}

Employee.layout = {
    breadcrumbs: [
        {
            title: 'Employee',
            href: '/employee',
        },
    ],
};
