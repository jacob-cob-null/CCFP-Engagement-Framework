import { Head, router, useForm, usePage, Deferred } from '@inertiajs/react';
import { CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    AcademicTerm,
    AttendanceRecord,
    Employee,
    Event,
    Paginated,
    ParticipationRole,
    PointPolicy,
} from '@/types';

type Props = {
    events: Event[];
    selectedEvent: Event | null;
    attendanceRecords?: AttendanceRecord[];
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

function RecordModal({
    eventId,
    onClose,
}: {
    eventId: string;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        event_id: eventId,
        search_query: '',
        participation_role: 'participant' as ParticipationRole,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/attendance', {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Record Attendance</h2>
                    <button onClick={onClose}>
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="sq">Employee Name or Number</Label>
                        <Input
                            id="sq"
                            value={data.search_query}
                            onChange={(e) =>
                                setData('search_query', e.target.value)
                            }
                            placeholder="Juan dela Cruz or 12345"
                            required
                            autoFocus
                        />
                        {errors.search_query && (
                            <p className="text-xs text-red-500">
                                {errors.search_query}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="arole">Participation Role</Label>
                        <select
                            id="arole"
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
                            {processing ? 'Recording…' : 'Record'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
    events,
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

    function selectEvent(eventId: string) {
        router.get(
            '/attendance',
            { event_id: eventId },
            { preserveState: true, replace: true },
        );
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/attendance/${deleteTarget.attendance_id}`, {
            data: { event_id: selectedEvent?.event_id },
            onSuccess: () => setDeleteTarget(null),
        });
    }

    const totalPoints = (attendanceRecords || []).reduce(
        (sum, r) => sum + r.points_awarded,
        0,
    );

    return (
        <div className="flex min-h-screen flex-1 flex-col bg-[#fafafa] p-8">
            <Head title="Attendance" />
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Attendance
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Select an event to view or record attendance.
                </p>
            </div>

            {flash?.success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {flash.success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Event Selector */}
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-700">
                            Events ({events.length})
                        </p>
                    </div>
                    <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
                        {events.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-slate-400">
                                No events available.
                            </p>
                        ) : (
                            events.map((event) => (
                                <button
                                    key={event.event_id}
                                    onClick={() => selectEvent(event.event_id)}
                                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${selectedEvent?.event_id === event.event_id ? 'border-l-4 border-l-indigo-600 bg-indigo-50' : ''}`}
                                >
                                    <p className="text-sm leading-tight font-medium text-slate-900">
                                        {event.title}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                        <CalendarDays className="h-3 w-3" />{' '}
                                        {event.event_date} ·{' '}
                                        <span className="capitalize">
                                            {event.scope}
                                        </span>
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Attendance Records */}
                <div className="lg:col-span-2">
                    {!selectedEvent ? (
                        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                            Select an event to view attendance records.
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        {selectedEvent.title}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {selectedEvent.event_date} ·{' '}
                                        {attendanceRecords?.length ?? 0} records ·{' '}
                                        {totalPoints} total pts
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Quick check: {totalCount} present ·
                                        Recent: {recentRecords.length}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowRecord(true)}
                                    className="gap-1.5 bg-indigo-900 text-white hover:bg-indigo-800"
                                >
                                    <Plus className="h-4 w-4" /> Record
                                </Button>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                {recentRecords.length > 0 && (
                                    <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                                        Recent records:{' '}
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
                                        <Deferred data="attendanceRecords" fallback={<AttendanceSkeleton rows={5} />}>
                                            {(!attendanceRecords || attendanceRecords.length === 0) ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-4 py-8 text-center text-slate-400"
                                                    >
                                                        No attendance recorded yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                attendanceRecords.map((rec) => (
                                                    <tr
                                                        key={rec.attendance_id}
                                                        className="transition-colors hover:bg-slate-50"
                                                    >
                                                        <td className="px-4 py-3 font-medium text-slate-900">
                                                            {
                                                                rec.employee
                                                                    ?.employee_name
                                                            }
                                                            <span className="ml-1 font-mono text-xs text-slate-400">
                                                                #
                                                                {
                                                                    rec.employee
                                                                        ?.employee_number
                                                                }
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
                                                                {rec.points_awarded}{' '}
                                                                pt
                                                                {rec.points_awarded !==
                                                                1
                                                                    ? 's'
                                                                    : ''}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-400">
                                                            {new Date(
                                                                rec.recorded_at,
                                                            ).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    title="Override"
                                                                    onClick={() =>
                                                                        setOverrideTarget(
                                                                            rec,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    title="Remove"
                                                                    onClick={() =>
                                                                        setDeleteTarget(
                                                                            rec,
                                                                        )
                                                                    }
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
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showRecord && selectedEvent && (
                <RecordModal
                    eventId={selectedEvent.event_id}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
        { title: 'Attendance', href: '/attendance' },
    ],
};

function AttendanceSkeleton({ rows = 5 }: { rows?: number }) {
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
