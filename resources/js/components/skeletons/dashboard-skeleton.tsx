import React from 'react';

export function DashboardSkeleton() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen animate-in fade-in duration-200">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-slate-100 rounded mt-2 animate-pulse" />
                </div>
                <div className="h-12 w-48 bg-white rounded-lg border border-slate-200 animate-pulse" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-32 animate-pulse">
                        <div className="flex items-start justify-between">
                            <div className="space-y-4 w-full">
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                                <div className="h-8 bg-slate-200 rounded w-1/3" />
                            </div>
                            <div className="p-3 rounded-xl bg-slate-200 w-12 h-12" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="flex flex-col gap-6 xl:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-48 animate-pulse" />
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-64 animate-pulse" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-0 shadow-sm xl:col-span-2 overflow-hidden flex flex-col h-[600px] animate-pulse">
                    <div className="border-b border-slate-100 p-6 flex justify-between items-center">
                        <div className="h-6 w-64 bg-slate-200 rounded" />
                    </div>
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-200" />
                                <div className="h-4 flex-1 bg-slate-100 rounded" />
                                <div className="h-4 w-24 bg-slate-100 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MetricCardSkeleton() {
    return (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col relative overflow-hidden animate-pulse">
            <div className="flex items-start justify-between relative z-10 w-full">
                <div className="space-y-4 w-full">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/3 mt-2"></div>
                </div>
                <div className="p-3 rounded-xl bg-slate-200 w-12 h-12 flex-shrink-0"></div>
            </div>
        </div>
    );
}

export function BreakdownSkeleton({ rows = 2 }: { rows: number }) {
    return (
        <div className="space-y-5">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-end mb-2">
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5"></div>
                </div>
            ))}
        </div>
    );
}

export function LeaderboardSkeleton({ rows = 5 }: { rows: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50">
                    <td className="px-6 py-4">
                        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="h-6 bg-slate-200 rounded w-16 ml-auto"></div>
                    </td>
                </tr>
            ))}
        </>
    );
}
