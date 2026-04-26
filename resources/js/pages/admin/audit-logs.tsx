import { Head, router, usePage, Deferred } from '@inertiajs/react';
import { Search, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActivityLog, Paginated } from '@/types';

type Props = {
    logs?: Paginated<ActivityLog>;
    actionTypes: string[];
    filters: { search?: string; action_type?: string };
};

export default function AuditLogsPage({ logs, actionTypes, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [actionFilter, setActionFilter] = useState(filters.action_type ?? '');
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    function applyFilters() {
        router.get('/audit-logs', { search, action_type: actionFilter }, { preserveState: true, replace: true });
    }

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Audit Logs" />
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Trail</h1>
                <p className="mt-1 text-sm text-slate-500">Read-only event stream of all administrative actions securely logged by the system.</p>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Input 
                    placeholder="Search descriptions…" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()} 
                    className="w-64" 
                />
                <select 
                    value={actionFilter} 
                    onChange={e => setActionFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Action Types</option>
                    {actionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Button variant="outline" onClick={applyFilters}>Filter</Button>
                {(search || actionFilter) && (
                    <Button variant="ghost" onClick={() => { setSearch(''); setActionFilter(''); router.get('/audit-logs'); }} className="text-slate-500">Clear</Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Timestamp</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Action Type</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Description</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">Metadata</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        <Deferred data="logs" fallback={<AuditSkeleton rows={10} />}>
                            {(!logs || logs.data.length === 0) ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-sans text-sm">No activity logs found.</td></tr>
                            ) : logs.data.map(log => (
                                <tr key={log.log_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700">{log.user?.user_name || log.user_id}</td>
                                    <td className="px-4 py-3"><span className="text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded">{log.action_type}</span></td>
                                    <td className="px-4 py-3 text-slate-600 max-w-sm"><div className="truncate" title={log.description}>{log.description}</div></td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="icon" variant="ghost" onClick={() => setSelectedLog(log)}><Eye className="h-4 w-4 text-slate-500" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {logs && logs.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Showing {logs.from}–{logs.to} of {logs.total}</span>
                    <div className="flex gap-1">
                        {logs.links.map((link, i) => (
                            link.url ? (
                                <a key={i} href={link.url}
                                    className={`rounded px-3 py-1.5 border transition-colors ${link.active ? 'bg-indigo-900 text-white border-indigo-900' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="rounded px-3 py-1.5 border border-slate-100 bg-slate-50 text-slate-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
                        <div className="mb-4 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-mono uppercase">{selectedLog.action_type}</span>
                            </h2>
                            <button onClick={() => setSelectedLog(null)}><span className="sr-only">Close</span>✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-900 rounded-lg p-4 font-mono text-xs text-sky-300">
                            <div className="mb-4 text-slate-300">User ID: {selectedLog.user_id}</div>
                            {selectedLog.target_id && <div className="mb-4 text-slate-300">Target ID: {selectedLog.target_id}</div>}
                            <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                        </div>
                        <div className="mt-4 flex justify-end shrink-0">
                            <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

AuditLogsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Audit Logs', href: '/audit-logs' },
    ],
};

function AuditSkeleton({ rows = 10 }: { rows?: number }) {
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
