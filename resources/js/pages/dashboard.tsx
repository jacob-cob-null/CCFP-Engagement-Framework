import { Head, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { Users, CalendarDays, ClipboardCheck, Trophy, Target, GraduationCap, Building2 } from 'lucide-react';
import type { AcademicTerm, Employee, OrganizationalUnit } from '@/types';

type Metrics = {
    total_employees: number;
    total_events: number;
    total_attendance: number;
    total_points: number;
};

type Breakdowns = {
    personnel_type: { teaching: number; non_teaching: number };
    event_scope: { university: number; college: number; organization: number };
};

type LeaderboardEntry = {
    employee_id: string;
    total_points: number;
    employee: {
        employee_name: string;
        employee_number: number;
        personnel_type: string;
        unit?: { unit_name: string; unit_id: string };
    };
};

type Props = {
    terms: AcademicTerm[];
    selectedTermId: string | null;
    metrics: Metrics;
    breakdowns: Breakdowns;
    topEmployees: LeaderboardEntry[];
};

export default function Dashboard({ terms = [], selectedTermId, metrics = { total_employees: 0, total_events: 0, total_attendance: 0, total_points: 0 }, breakdowns = { personnel_type: { teaching: 0, non_teaching: 0 }, event_scope: { university: 0, college: 0, organization: 0 } }, topEmployees = [] }: Props) {
    function changeTerm(termId: string) {
        router.get('/dashboard', { term_id: termId }, { preserveState: true });
    }

    // Helper to calculate percentages
    const totalByRole = breakdowns.personnel_type.teaching + breakdowns.personnel_type.non_teaching;
    const pTeaching = totalByRole > 0 ? (breakdowns.personnel_type.teaching / totalByRole) * 100 : 0;
    const pNonTeaching = totalByRole > 0 ? (breakdowns.personnel_type.non_teaching / totalByRole) * 100 : 0;

    const totalByScope = breakdowns.event_scope.university + breakdowns.event_scope.college + breakdowns.event_scope.organization;
    const pUniv = totalByScope > 0 ? (breakdowns.event_scope.university / totalByScope) * 100 : 0;
    const pCol = totalByScope > 0 ? (breakdowns.event_scope.college / totalByScope) * 100 : 0;
    const pOrg = totalByScope > 0 ? (breakdowns.event_scope.organization / totalByScope) * 100 : 0;

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Dashboard" />
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-2">Overview of engagement metrics and top performers.</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5">
                    <label htmlFor="term-filter" className="text-sm text-slate-500 font-medium pl-2">Term:</label>
                    <select
                        id="term-filter"
                        value={selectedTermId || ''}
                        onChange={(e) => changeTerm(e.target.value)}
                        className="bg-slate-50 border-none outline-none text-sm font-semibold text-slate-700 py-1.5 px-3 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <option value="">All Terms</option>
                        {terms.map((t) => (
                            <option key={t.term_id} value={t.term_id}>
                                {t.academic_year} - {t.semester} {t.is_current ? '(Current)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <MetricCard title="Total Employees" value={metrics.total_employees} icon={Users} color="indigo" />
                <MetricCard title="Events Held" value={metrics.total_events} icon={CalendarDays} color="blue" />
                <MetricCard title="Attendance Records" value={metrics.total_attendance} icon={ClipboardCheck} color="amber" />
                <MetricCard title="Points Awarded" value={metrics.total_points} icon={Trophy} color="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Breakdowns Column */}
                <div className="flex flex-col gap-6 xl:col-span-1">
                    {/* Personnel Type Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-indigo-500" /> Attendance by Role
                        </h3>
                        {totalByRole === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">No data available.</p>
                        ) : (
                            <div className="space-y-4">
                                <ProgressBar label="Teaching" count={breakdowns.personnel_type.teaching} percentage={pTeaching} colorClass="bg-indigo-500" />
                                <ProgressBar label="Non-Teaching" count={breakdowns.personnel_type.non_teaching} percentage={pNonTeaching} colorClass="bg-sky-500" />
                            </div>
                        )}
                    </div>
                    
                    {/* Scope Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                            <Target className="h-5 w-5 text-indigo-500" /> Attendance by Scope
                        </h3>
                        {totalByScope === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">No data available.</p>
                        ) : (
                            <div className="space-y-4">
                                <ProgressBar label="University-Wide" count={breakdowns.event_scope.university} percentage={pUniv} colorClass="bg-purple-500" />
                                <ProgressBar label="College-Based" count={breakdowns.event_scope.college} percentage={pCol} colorClass="bg-blue-500" />
                                <ProgressBar label="Organization-Based" count={breakdowns.event_scope.organization} percentage={pOrg} colorClass="bg-teal-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Leaderboard Column */}
                <div className="bg-white border border-slate-200 rounded-xl p-0 shadow-sm xl:col-span-2 overflow-hidden flex flex-col">
                    <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" /> Top Employees Leaderboard
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Top performers for the selected period.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Unit</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                            No points recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    topEmployees.map((entry, idx) => (
                                        <tr key={entry.employee_id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className={`
                                                    flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                                    ${idx === 0 ? 'bg-amber-100 text-amber-700 shadow-sm' : 
                                                      idx === 1 ? 'bg-slate-200 text-slate-700 shadow-sm' : 
                                                      idx === 2 ? 'bg-orange-100 text-orange-800 shadow-sm' : 
                                                      'bg-slate-50 text-slate-500'}
                                                `}>
                                                    {idx + 1}
                                                </div>
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
                                                    ${entry.employee.personnel_type === 'teaching' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'bg-sky-50 text-sky-700'}
                                                `}>
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {topEmployees.length > 0 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                            <button onClick={() => router.get('/employee-points')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                                View Full Leaderboard →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

function MetricCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: 'indigo' | 'blue' | 'amber' | 'emerald' }) {
    const colorStyles = {
        indigo: 'from-indigo-50 to-indigo-100/50 text-indigo-600 border-indigo-100',
        blue: 'from-blue-50 to-blue-100/50 text-blue-600 border-blue-100',
        amber: 'from-amber-50 to-amber-100/50 text-amber-600 border-amber-100',
        emerald: 'from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-100',
    };
    
    const iconBgs = {
        indigo: 'bg-indigo-100/80 text-indigo-600',
        blue: 'bg-blue-100/80 text-blue-600',
        amber: 'bg-amber-100/80 text-amber-600',
        emerald: 'bg-emerald-100/80 text-emerald-600',
    };

    return (
        <div className={`bg-gradient-to-b ${colorStyles[color]} border rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-wider opacity-80">{title}</p>
                    <p className="text-4xl font-extrabold tracking-tight">{value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl ${iconBgs[color]} shadow-sm`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}

function ProgressBar({ label, count, percentage, colorClass }: { label: string, count: number, percentage: number, colorClass: string }) {
    return (
        <div>
            <div className="flex justify-between items-end mb-1.5">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <span className="text-sm font-bold text-slate-900">{count.toLocaleString()} <span className="text-xs text-slate-400 font-medium ml-1">({percentage.toFixed(0)}%)</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner flex">
                <div 
                    className={`${colorClass} h-2.5 rounded-full transition-all duration-100ease-out`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}
