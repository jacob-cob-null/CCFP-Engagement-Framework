import React from 'react';

export function AttendanceSkeleton() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen animate-in fade-in duration-200">
            <div className="mb-6">
                <div className="h-9 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-72 bg-slate-100 rounded mt-2 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="px-4 py-3">
                                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse mb-1" />
                                <div className="h-3 w-1/2 bg-slate-50 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                            <div className="h-3 w-64 bg-slate-100 rounded mt-1 animate-pulse" />
                        </div>
                        <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Employee', 'Role', 'Points', 'Recorded At', 'Actions'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400">
                                            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AttendanceTableRowsSkeleton rows={8} />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AttendanceTableRowsSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50">
                    <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-1.5"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="h-5 bg-slate-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-1">
                            <div className="w-8 h-8 bg-slate-200 rounded"></div>
                            <div className="w-8 h-8 bg-slate-200 rounded"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
}
