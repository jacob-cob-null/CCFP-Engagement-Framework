import { Head, router, usePage, Deferred } from '@inertiajs/react';
import { ArchiveTableRowsSkeleton } from '@/components/skeletons/semester-archive-skeleton';
import { Archive, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types';

type TermSummary = {
    term_id: string;
    academic_year: string;
    semester: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    active_count: number;
    archived_count: number;
};

type Props = {
    terms?: Paginated<TermSummary>;
};

function ConfirmDialog({
    term,
    onConfirm,
    onCancel,
}: {
    term: TermSummary;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                    Archive Attendance?
                </h2>
                <p className="mb-1 text-sm text-slate-600">
                    This will soft-delete{' '}
                    <span className="font-semibold text-slate-900">
                        {term.active_count}
                    </span>{' '}
                    attendance record(s) for:
                </p>
                <p className="mb-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                    {term.academic_year} — {term.semester} Semester
                </p>
                <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    ⚠️ Records will be hidden from active views but are never
                    permanently deleted.
                    <strong> Point totals are preserved.</strong>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-amber-600 text-white hover:bg-amber-700"
                        onClick={onConfirm}
                    >
                        Archive {term.active_count} Records
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function SemesterArchivePage({ terms }: Props) {
    const { props } = usePage<{
        flash?: { success?: string; info?: string };
    }>();
    const flash = props.flash;
    const [archiveTarget, setArchiveTarget] = useState<TermSummary | null>(
        null,
    );

    function confirmArchive() {
        if (!archiveTarget) return;
        router.post(
            `/semester-archive/${archiveTarget.term_id}`,
            {},
            {
                onSuccess: () => setArchiveTarget(null),
            },
        );
    }

    return (
        <div className="flex min-h-screen flex-1 flex-col bg-[#fafafa] p-4 sm:p-8">
            <Head title="Semester Archive" />

            <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Semester Archive
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Bulk soft-delete attendance records at semester end. Point
                    totals are always preserved.
                </p>
            </div>

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {flash.success}
                </div>
            )}
            {flash?.info && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    {flash.info}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Term
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Period
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-600">
                                Active Records
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-600">
                                Archived Records
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <Deferred
                            data="terms"
                            fallback={<ArchiveTableRowsSkeleton rows={5} />}
                        >
                            {!terms || terms.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-slate-400"
                                    >
                                        No academic terms found.
                                    </td>
                                </tr>
                            ) : (
                                terms.data.map((term) => (
                                    <tr
                                        key={term.term_id}
                                        className="transition-colors hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">
                                                    {term.academic_year} —{' '}
                                                    {term.semester} Sem
                                                </span>
                                                {term.is_current && (
                                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {new Date(
                                                term.start_date,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}{' '}
                                            →{' '}
                                            {new Date(
                                                term.end_date,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    term.active_count > 0
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                {term.active_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                                                {term.archived_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {term.active_count > 0 ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    onClick={() =>
                                                        setArchiveTarget(term)
                                                    }
                                                >
                                                    <Archive className="h-3.5 w-3.5" />
                                                    Archive
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-slate-300">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {terms && terms.total > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Showing {terms.from || 0}–{terms.to || 0} of {terms.total}</span>
                    <div className="flex gap-1">
                        {terms.links.map((link, i) => (
                            link.url ? (
                                <button 
                                    key={i} 
                                    onClick={() => router.get(link.url!, {}, { preserveState: true, replace: true })}
                                    className={`rounded px-3 py-1.5 border text-sm transition-colors ${link.active ? 'bg-indigo-900 text-white border-indigo-900' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} 
                                />
                            ) : (
                                <span 
                                    key={i} 
                                    className="rounded px-3 py-1.5 border border-slate-100 bg-slate-50 text-slate-300 text-sm" 
                                    dangerouslySetInnerHTML={{ __html: link.label }} 
                                />
                            )
                        ))}
                    </div>
                </div>
            )}

            <p className="mt-4 text-xs text-slate-400">
                Archiving only hides records from active views. All data is
                preserved in the database and annual point totals in{' '}
                <code>employee_point_totals</code> are never modified.
            </p>

            {archiveTarget && (
                <ConfirmDialog
                    term={archiveTarget}
                    onConfirm={confirmArchive}
                    onCancel={() => setArchiveTarget(null)}
                />
            )}
        </div>
    );
}

SemesterArchivePage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Semester Archive', href: '/semester-archive' },
    ],
};
