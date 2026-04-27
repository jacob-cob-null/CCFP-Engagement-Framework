import React from 'react';

export function AuditLogsSkeleton() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen animate-in fade-in duration-200">
            <div className="mb-6">
                <div className="h-9 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-96 bg-slate-100 rounded mt-2 animate-pulse" />
            </div>

            <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-10 w-64 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-48 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-24 bg-slate-100 rounded animate-pulse" />
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Timestamp', 'User', 'Action Type', 'Description', 'Metadata'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400">
                                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        <AuditTableRowsSkeleton rows={10} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function AuditTableRowsSkeleton({ rows = 10 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50">
                    <td className="px-4 py-4">
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="h-5 bg-slate-100 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="h-3 bg-slate-200 rounded w-48"></div>
                    </td>
                    <td className="px-4 py-4 text-right">
                        <div className="h-8 bg-slate-100 rounded w-8 ml-auto"></div>
                    </td>
                </tr>
            ))}
        </>
    );
}
