import { Head, router, usePage, Deferred } from '@inertiajs/react';
import { Download, Search, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AcademicTerm, OrganizationalUnit, Paginated } from '@/types';

type LeaderboardEntry = {
    employee_id: string;
    term_id: string;
    total_points: number;
    last_calculated_at: string;
    employee: {
        employee_name: string;
        employee_number: number;
        personnel_type: string;
        unit?: { unit_name: string; unit_id: string };
    };
};

type Props = {
    leaderboard?: Paginated<LeaderboardEntry>;
    terms: AcademicTerm[];
    units: OrganizationalUnit[];
    filters: {
        search: string;
        term_id: string;
        unit_id: string;
        personnel_type: string;
    };
};

export default function EmployeePointsPage({ leaderboard, terms, units, filters }: Props) {
    const { props } = usePage<{ auth: { user: { role: string } } }>();
    const isAdmin = props.auth.user.role === 'ccfp_admin';

    const [search, setSearch] = useState(filters.search ?? '');
    const [termFilter, setTermFilter] = useState(filters.term_id ?? '');
    const [unitFilter, setUnitFilter] = useState(filters.unit_id ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.personnel_type ?? '');

    function applyFilters() {
        router.get('/employee-points', { 
            search, 
            term_id: termFilter, 
            unit_id: unitFilter, 
            personnel_type: typeFilter 
        }, { preserveState: true, replace: true });
    }

    function downloadExport() {
        if (!termFilter) return;
        window.location.href = `/export/points/${termFilter}`;
    }

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Employee Point Leaderboard" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Point Leaderboard</h1>
                    <p className="mt-1 text-sm text-slate-500">View accumulated points for each employee.</p>
                </div>
                <Button 
                    onClick={downloadExport} 
                    disabled={!termFilter}
                    className="bg-green-700 text-white hover:bg-green-800 gap-1.5"
                >
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Input 
                    placeholder="Search name or no…" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()} 
                    className="w-56" 
                />
                <select 
                    value={termFilter} 
                    onChange={e => setTermFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="" disabled>Select Term…</option>
                    {terms.map(t => <option key={t.term_id} value={t.term_id}>{t.academic_year} {t.semester}</option>)}
                </select>
                {isAdmin && (
                    <select 
                        value={unitFilter} 
                        onChange={e => setUnitFilter(e.target.value)}
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Units</option>
                        {units.map(u => <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>)}
                    </select>
                )}
                <select 
                    value={typeFilter} 
                    onChange={e => setTypeFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Personnel Types</option>
                    <option value="teaching">Teaching</option>
                    <option value="non-teaching">Non-Teaching</option>
                </select>
                <Button variant="outline" onClick={applyFilters}>Filter</Button>
                {(search || unitFilter || typeFilter || termFilter !== filters.term_id) && (
                    <Button variant="ghost" onClick={() => { 
                        setSearch(''); setUnitFilter(''); setTypeFilter(''); 
                        const defaultTerm = terms.find(t => t.is_current)?.term_id || '';
                        setTermFilter(defaultTerm);
                        router.get('/employee-points', {term_id: defaultTerm}); 
                    }} className="text-slate-500">Clear</Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100/50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-slate-600">Rank</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-600">Employee</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-600">Unit</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-600">Type</th>
                            <th className="px-6 py-4 text-right font-semibold text-slate-600">Total Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <Deferred data="leaderboard" fallback={<PointsSkeleton rows={10} />}>
                            {(!leaderboard || leaderboard.data.length === 0) ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">No point records found.</td></tr>
                            ) : leaderboard.data.map((entry, i) => (
                                <tr key={entry.employee_id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-slate-500 font-medium w-8 text-center">{leaderboard.from! + i}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900">{entry.employee.employee_name}</p>
                                        <p className="font-mono text-xs text-slate-400 mt-0.5">#{entry.employee.employee_number}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                            {entry.employee.unit?.unit_id || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                                            ${entry.employee.personnel_type === 'teaching' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'}`}>
                                            {entry.employee.personnel_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-baseline gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50">
                                            <span className="text-lg font-bold text-emerald-700 leading-none">{entry.total_points}</span>
                                            <span className="text-xs font-medium text-emerald-600/80 uppercase tracking-widest">pts</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {leaderboard && leaderboard.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Showing {leaderboard.from}–{leaderboard.to} of {leaderboard.total}</span>
                    <div className="flex gap-1">
                        {leaderboard.links.map((link, i) => (
                            link.url ? (
                                <a key={i} href={link.url}
                                    className={`rounded px-3 py-1.5 border text-sm ${link.active ? 'bg-indigo-900 text-white border-indigo-900' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="rounded px-3 py-1.5 border border-slate-100 bg-slate-50 text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

EmployeePointsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Points', href: '/employee-points' },
    ],
};

function PointsSkeleton({ rows = 10 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50">
                    <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-4 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-5 bg-slate-100 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="h-10 bg-emerald-50/50 rounded-lg w-16 ml-auto"></div>
                    </td>
                </tr>
            ))}
        </>
    );
}
