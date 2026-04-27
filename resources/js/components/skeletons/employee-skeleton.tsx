import React from 'react';

export function EmployeeSkeleton() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen animate-in fade-in duration-200">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="h-9 w-72 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-slate-100 rounded mt-2 animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
            </div>

            <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-10 w-56 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-20 bg-slate-100 rounded animate-pulse" />
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            {['#', 'Name', 'Type', 'Unit', 'Points', 'Status', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400">
                                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <EmployeeTableRowsSkeleton rows={10} columns={7} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function EmployeeTableRowsSkeleton({ rows = 5, columns = 7 }: { rows?: number; columns?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50">
                    {Array.from({ length: columns }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
