import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, CheckCircle, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import MinimalLayout from '@/layouts/minimal-layout';
import type { AttendanceRecord, Event, ParticipationRole } from '@/types';

type Props = {
    events: Event[];
    selectedEvent: Event | null;
    recentRecords: AttendanceRecord[];
    totalCount: number;
    filters: { event_id?: string };
};

const ROLES: { value: ParticipationRole; label: string }[] = [
    { value: 'participant', label: 'Participant' },
    { value: 'organizer',   label: 'Organizer' },
    { value: 'donor',       label: 'Donor' },
];

export default function LiveAttendancePage({ events, selectedEvent, recentRecords, totalCount, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; info?: string } }>();
    const flash = props.flash;

    const { data, setData, post, processing, errors, reset } = useForm({
        event_id:           selectedEvent?.event_id ?? '',
        search_query:       '',
        participation_role: 'participant' as ParticipationRole,
    });

    // Auto-focus the employee input after each successful submission
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (flash?.success) {
            reset('search_query');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [flash?.success]);

    function selectEvent(eventId: string) {
        router.get('/attendance/live', { event_id: eventId }, { preserveState: false });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/attendance/live');
    }

    return (
        <>
            <Head title="Live Attendance" />

            {/* Event selector (shown when no event selected or as a change button) */}
            {!selectedEvent ? (
                <div>
                    <h1 className="mb-4 text-xl font-bold text-slate-900">Select an Event</h1>
                    {events.length === 0 ? (
                        <p className="text-center text-sm text-slate-400">No active events available.</p>
                    ) : (
                        <div className="space-y-2">
                            {events.map(event => (
                                <button
                                    key={event.event_id}
                                    onClick={() => selectEvent(event.event_id)}
                                    className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100"
                                >
                                    <p className="font-semibold text-slate-900">{event.title}</p>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                        <CalendarDays className="h-3 w-3" />
                                        {event.event_date as string} · <span className="capitalize">{event.scope}</span>
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Event header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">{selectedEvent.title}</h1>
                            <p className="mt-0.5 text-xs text-slate-400 capitalize">
                                {selectedEvent.event_date as string} · {selectedEvent.scope} · {totalCount} recorded
                            </p>
                        </div>
                        <button
                            onClick={() => router.get('/attendance/live')}
                            className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 shadow-sm hover:bg-slate-50"
                        >
                            Change
                        </button>
                    </div>

                    {/* Flash messages */}
                    {flash?.success && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            {flash.success}
                        </div>
                    )}
                    {flash?.info && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                            {flash.info}
                        </div>
                    )}

                    {/* Record form */}
                    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="space-y-1.5">
                            <label htmlFor="sq" className="block text-sm font-medium text-slate-700">
                                Employee Name or Number
                            </label>
                            <input
                                ref={inputRef}
                                id="sq"
                                type="text"
                                autoFocus
                                autoComplete="off"
                                autoCapitalize="words"
                                value={data.search_query}
                                onChange={e => setData('search_query', e.target.value)}
                                placeholder="Juan dela Cruz or 12345"
                                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                required
                            />
                            {errors.search_query && (
                                <p className="text-sm text-red-600">{errors.search_query}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                                Participation Role
                            </label>
                            <select
                                id="role"
                                value={data.participation_role}
                                onChange={e => setData('participation_role', e.target.value as ParticipationRole)}
                                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                {ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.search_query.trim()}
                            className="h-12 w-full rounded-lg bg-indigo-900 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-800 active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Recording…' : '✓ Record Attendance'}
                        </button>
                    </form>

                    {/* Recent records (last 5) */}
                    {recentRecords.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Recent — last {recentRecords.length}
                            </p>
                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                {recentRecords.map(rec => (
                                    <div key={rec.attendance_id} className="flex items-center gap-3 px-4 py-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 shrink-0">
                                            <User className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-900">
                                                {rec.employee?.employee_name}
                                                {rec.is_manual_override && (
                                                    <span className="ml-1 text-xs font-normal text-orange-500">override</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-400 capitalize">{rec.participation_role}</p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                            {rec.points_awarded} pt{rec.points_awarded !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

// Use the minimal no-sidebar layout
LiveAttendancePage.layout = (page: React.ReactNode) => <MinimalLayout>{page}</MinimalLayout>;
