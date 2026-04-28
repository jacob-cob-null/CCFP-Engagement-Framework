import { Head, router, useForm, usePage, Deferred } from '@inertiajs/react';
import { AttendanceTableRowsSkeleton } from '@/components/skeletons/attendance-skeleton';
import { CalendarDays, Pencil, Plus, Trash2, X, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    AttendanceRecord,
    Employee,
    Event,
    Paginated,
    ParticipationRole,
    PointPolicy,
} from '@/types';

type Props = {
    selectedEvent: Event | null;
    attendanceRecords?: Paginated<AttendanceRecord>;
    pointPolicies: PointPolicy[];
    filters: { event_id?: string };
};

type RecentRecord = {
    attendance_id: string;
    employee?: Employee;
    recorded_at: string;
};

const ROLES: { value: ParticipationRole; label: string }[] = [
    { value: 'participant', label: 'Participant' },
    { value: 'organizer', label: 'Organizer' },
    { value: 'donor', label: 'Donor' },
];

import { RecordAttendancePanel } from '@/components/record-attendance';

function OverrideModal({
    record,
    onClose,
}: {
    record: AttendanceRecord;
    onClose: () => void;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        points_awarded: record.points_awarded,
        participation_role: record.participation_role,
        override_reason: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/attendance/${record.attendance_id}`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Override Record</h2>
                    <button onClick={onClose}>
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>
                <p className="mb-3 text-sm text-slate-500">
                    Employee:{' '}
                    <span className="font-medium">
                        {record.employee?.employee_name}
                    </span>
                </p>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Role</Label>
                            <select
                                value={data.participation_role}
                                onChange={(e) =>
                                    setData(
                                        'participation_role',
                                        e.target.value as ParticipationRole,
                                    )
                                }
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Points Awarded</Label>
                            <Input
                                type="number"
                                min={0}
                                value={data.points_awarded}
                                onChange={(e) =>
                                    setData(
                                        'points_awarded',
                                        parseInt(e.target.value) || 0,
                                    )
                                }
                                required
                            />
                            {errors.points_awarded && (
                                <p className="text-xs text-red-500">
                                    {errors.points_awarded}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label>
                            Override Reason{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={data.override_reason}
                            onChange={(e) =>
                                setData('override_reason', e.target.value)
                            }
                            placeholder="Reason for manual override"
                            required
                        />
                        {errors.override_reason && (
                            <p className="text-xs text-red-500">
                                {errors.override_reason}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-indigo-900 text-white hover:bg-indigo-800"
                        >
                            {processing ? 'Saving…' : 'Apply Override'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AttendancePage({
    selectedEvent,
    attendanceRecords,
    pointPolicies,
    filters,
}: Props) {
    const { props } = usePage<{
        flash?: { success?: string };
        recentRecords?: RecentRecord[];
        totalCount?: number;
    }>();
    const flash = props.flash;
    const recentRecords: RecentRecord[] = props.recentRecords ?? [];
    const totalCount: number = props.totalCount ?? 0;

    const [showRecord, setShowRecord] = useState(false);
    const [overrideTarget, setOverrideTarget] =
        useState<AttendanceRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(
        null,
    );

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/attendance/${deleteTarget.attendance_id}`, {
            data: { event_id: selectedEvent?.event_id },
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <div className="flex min-h-screen flex-1 flex-col bg-[#fafafa] p-4 sm:p-8">
            <Head title={`Attendance - ${selectedEvent?.title ?? 'No Event'}`} />
            
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.get('/events/setup')}
                        className="-ml-2 mb-2 flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Events
                    </Button>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        {selectedEvent?.title ?? 'Attendance'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {selectedEvent ? (
                            <>
                                {new Date(selectedEvent.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ·{' '}
                                <span className="capitalize">{selectedEvent.scope}</span>
                            </>
                        ) : (
                            'Select an event from the events page to manage attendance.'
                        )}
                    </p>
                </div>
                {selectedEvent && (
                    <Button
                        onClick={() => setShowRecord(true)}
                        className="w-full gap-1.5 bg-indigo-900 text-white hover:bg-indigo-800 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" /> Record Attendance
                    </Button>
                )}
            </div>

            {flash?.success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {flash.success}
                </div>
            )}

            {!selectedEvent ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <CalendarDays className="mb-4 h-12 w-12 text-slate-200" />
                    <h3 className="mb-1 text-lg font-medium text-slate-900">No Event Selected</h3>
                    <p className="mb-6 max-w-xs text-sm text-slate-500">
                        Please go back to the events page and select an event to view its attendance records.
                    </p>
                    <Button onClick={() => router.get('/events/setup')}>Go to Events</Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                            <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Total Present</p>
                            <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">{totalCount}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                            <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Point Calculation</p>
                            <div className="mt-1">
                                {selectedEvent.point_overrides && selectedEvent.point_overrides.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedEvent.point_overrides.map(o => (
                                            <span key={o.override_id} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                                {o.participation_role}: {o.points_awarded}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-indigo-600">Using Global Policies</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                        {recentRecords.length > 0 && (
                            <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                                Recently added:{' '}
                                {recentRecords
                                    .map(
                                        (r) =>
                                            r.employee?.employee_name,
                                    )
                                    .join(', ')}
                            </div>
                        )}
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                        Employee
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                        Points
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                        Recorded At
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <Deferred data="attendanceRecords" fallback={<AttendanceTableRowsSkeleton rows={10} />}>
                                    {(!attendanceRecords || attendanceRecords.data.length === 0) ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-slate-400"
                                            >
                                                No attendance recorded yet for this event.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceRecords.data.map((rec) => (
                                            <tr
                                                key={rec.attendance_id}
                                                className="transition-colors hover:bg-slate-50"
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {rec.employee?.employee_name}
                                                    <span className="ml-1 font-mono text-xs text-slate-400">
                                                        #{rec.employee?.employee_number}
                                                    </span>
                                                    {rec.is_manual_override && (
                                                        <span className="ml-1 rounded bg-orange-100 px-1 text-xs text-orange-600">
                                                            override
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 capitalize">
                                                    {rec.participation_role}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                        {rec.points_awarded} pt{rec.points_awarded !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-400">
                                                    {new Date(rec.recorded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            title="Override"
                                                            onClick={() => setOverrideTarget(rec)}
                                                        >
                                                            <Pencil className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            title="Remove"
                                                            onClick={() => setDeleteTarget(rec)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-400" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </Deferred>
                            </tbody>
                        </table>
                        
                        {attendanceRecords && attendanceRecords.total > 0 && (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:gap-0">
                                <span className="text-center text-xs text-slate-500 sm:text-left">
                                    Showing {attendanceRecords.from} to {attendanceRecords.to || 0} of {attendanceRecords.total} entries
                                </span>
                                <div className="flex gap-1">
                                    {attendanceRecords.links.map((link, i) => (
                                        link.url ? (
                                            <button 
                                                key={i} 
                                                onClick={() => router.get(link.url!, {}, { preserveState: true, replace: true })}
                                                className={`rounded px-3 py-1.5 border text-xs ${link.active ? 'bg-indigo-900 text-white border-indigo-900' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }} 
                                            />
                                        ) : (
                                            <span 
                                                key={i} 
                                                className="rounded px-3 py-1.5 border border-slate-100 bg-slate-50 text-slate-300 text-xs" 
                                                dangerouslySetInnerHTML={{ __html: link.label }} 
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showRecord && selectedEvent && (
                <RecordAttendancePanel
                    event={selectedEvent}
                    onClose={() => setShowRecord(false)}
                />
            )}
            {overrideTarget && (
                <OverrideModal
                    record={overrideTarget}
                    onClose={() => setOverrideTarget(null)}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold">
                            Remove Record?
                        </h2>
                        <p className="mb-5 text-sm text-slate-600">
                            Remove attendance for{' '}
                            <span className="font-medium">
                                {deleteTarget.employee?.employee_name}
                            </span>
                            ? Points will be recalculated.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={confirmDelete}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

AttendancePage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/events/setup' },
        { title: 'Attendance', href: '/attendance' },
    ],
};



