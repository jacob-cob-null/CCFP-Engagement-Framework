import React from 'react';

export function SemesterArchiveSkeleton() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen animate-in fade-in duration-200">
            <div className="mb-6">
                <div className="h-9 w-64 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-[500px] bg-slate-100 rounded mt-2 animate-pulse" />
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Term', 'Period', 'Active Records', 'Archived Records', 'Action'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400">
                                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <ArchiveTableRowsSkeleton rows={8} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ArchiveTableRowsSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50">
                    <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                        <div className="h-5 bg-slate-100 rounded-full w-8 mx-auto"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                        <div className="h-5 bg-slate-100 rounded-full w-8 mx-auto"></div>
                    </td>
                    <td className="px-4 py-4 text-right">
                        <div className="h-8 bg-slate-200 rounded w-20 ml-auto"></div>
                    </td>
                </tr>
            ))}
        </>
    );
}
