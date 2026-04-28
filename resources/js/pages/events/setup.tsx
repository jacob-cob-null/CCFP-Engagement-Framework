import { Head, router, useForm, usePage, Deferred } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AcademicTerm, Event, EventScope, OrganizationalUnit, Paginated, ParticipationRole } from '@/types';

type Props = {
    events?: Paginated<Event>;
    terms: AcademicTerm[];
    units: OrganizationalUnit[];
    filters: { search?: string; scope?: string; term_id?: string; unit_id?: string };
};

const SCOPES: { value: EventScope; label: string }[] = [
    { value: 'university', label: 'University-Wide' },
    { value: 'college',    label: 'College-Based' },
    { value: 'organization', label: 'Organization-Based' },
];

type EventFormData = {
    title: string;
    description: string;
    scope: EventScope | '';
    activity_program: string;
    term_id: string;
    unit_id: string;
    event_date: string;
    point_overrides: { participation_role: ParticipationRole; points_awarded: number }[];
};

function EventModal({ mode, event, terms, units, userRole, userUnitId, onClose }: {
    mode: 'create' | 'edit';
    event?: Event;
    terms: AcademicTerm[];
    units: OrganizationalUnit[];
    userRole: string;
    userUnitId: string | null;
    onClose: () => void;
}) {
    const isAdmin = userRole === 'ccfp_admin';

    const { data, setData, post, patch, processing, errors, reset } = useForm<EventFormData>({
        title:            event?.title            ?? '',
        description:      event?.description      ?? '',
        scope:            (event?.scope           ?? '') as EventScope | '',
        activity_program: event?.activity_program ?? '',
        term_id:          event?.term_id          ?? '',
        unit_id:          event?.unit_id          ?? (isAdmin ? '' : (userUnitId ?? '')),
        event_date:       event?.event_date       ?? '',
        point_overrides:  event?.point_overrides?.map(o => ({
            participation_role: o.participation_role,
            points_awarded: o.points_awarded
        })) ?? [],
    });

    // Non-admins can't pick university scope
    const availableScopes = isAdmin ? SCOPES : SCOPES.filter(s => s.value !== 'university');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const options = { onSuccess: () => { reset(); onClose(); } };
        if (mode === 'create') {
            post('/events', options);
        } else {
            patch(`/events/${event!.event_id}`, options);
        }
    }

    const addOverride = () => {
        const remainingRoles = (['participant', 'organizer', 'donor'] as ParticipationRole[]).filter(
            r => !data.point_overrides.some(o => o.participation_role === r)
        );
        if (remainingRoles.length > 0) {
            setData('point_overrides', [...data.point_overrides, { participation_role: remainingRoles[0], points_awarded: 0 }]);
        }
    };

    const removeOverride = (index: number) => {
        setData('point_overrides', data.point_overrides.filter((_, i) => i !== index));
    };

    const updateOverride = (index: number, field: string, value: any) => {
        const newOverrides = [...data.point_overrides];
        newOverrides[index] = { ...newOverrides[index], [field]: value };
        setData('point_overrides', newOverrides);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{mode === 'create' ? 'Create Event' : 'Edit Event'}</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="etitle">Event Title</Label>
                        <Input id="etitle" value={data.title} onChange={e => setData('title', e.target.value)} placeholder="CCFP General Assembly" required />
                        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="escope">Scope</Label>
                            <select id="escope" value={data.scope} onChange={e => setData('scope', e.target.value as EventScope)}
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required>
                                <option value="" disabled>Select scope…</option>
                                {availableScopes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            {errors.scope && <p className="text-xs text-red-500">{errors.scope}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="edate">Event Date</Label>
                            <Input id="edate" type="date" value={data.event_date} onChange={e => setData('event_date', e.target.value)} required />
                            {errors.event_date && <p className="text-xs text-red-500">{errors.event_date}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="eterm">Academic Term</Label>
                            <select id="eterm" value={data.term_id} onChange={e => setData('term_id', e.target.value)}
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required>
                                <option value="" disabled>Select term…</option>
                                {terms.map(t => <option key={t.term_id} value={t.term_id}>
                                    {t.academic_year} {t.semester}{t.is_current ? ' (Current)' : ''}
                                </option>)}
                            </select>
                            {errors.term_id && <p className="text-xs text-red-500">{errors.term_id}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="eunit">Unit</Label>
                            {isAdmin ? (
                                <select id="eunit" value={data.unit_id} onChange={e => setData('unit_id', e.target.value)}
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required>
                                    <option value="" disabled>Select unit…</option>
                                    {units.map(u => <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>)}
                                </select>
                            ) : (
                                <Input value={units.find(u => u.unit_id === userUnitId)?.unit_name ?? userUnitId ?? ''} disabled className="bg-slate-100 text-slate-500" />
                            )}
                            {errors.unit_id && <p className="text-xs text-red-500">{errors.unit_id}</p>}
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="eprog">Activity / Program</Label>
                        <Input id="eprog" value={data.activity_program} onChange={e => setData('activity_program', e.target.value)} placeholder="Community Extension Program" />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="edesc">Description</Label>
                        <textarea id="edesc" value={data.description} onChange={e => setData('description', e.target.value)}
                            className="min-h-[80px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Optional description…" />
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold text-slate-700">Point Overrides (Optional)</Label>
                            {data.point_overrides.length < 3 && (
                                <button type="button" onClick={addOverride} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Add Override
                                </button>
                            )}
                        </div>
                        {data.point_overrides.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No custom points defined. Using global policies.</p>
                        ) : (
                            <div className="space-y-2">
                                {data.point_overrides.map((override, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-100">
                                        <select 
                                            value={override.participation_role} 
                                            onChange={e => updateOverride(i, 'participation_role', e.target.value)}
                                            className="h-8 flex-1 rounded border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            {(['participant', 'organizer', 'donor'] as ParticipationRole[]).map(r => (
                                                <option key={r} value={r} disabled={data.point_overrides.some((o, idx) => o.participation_role === r && idx !== i)}>
                                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        <Input 
                                            type="number" 
                                            min={0} 
                                            value={override.points_awarded} 
                                            onChange={e => updateOverride(i, 'points_awarded', parseInt(e.target.value) || 0)}
                                            className="h-8 w-20 px-2 text-xs" 
                                        />
                                        <span className="text-[10px] text-slate-400 font-medium">PTS</span>
                                        <button type="button" onClick={() => removeOverride(i)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {errors.point_overrides && <p className="text-xs text-red-500">{errors.point_overrides}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-900 text-white hover:bg-indigo-800">
                            {processing ? 'Saving…' : mode === 'create' ? 'Create Event' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const SCOPE_COLORS: Record<EventScope, string> = {
    university:   'bg-indigo-100 text-indigo-700',
    college:      'bg-blue-100 text-blue-700',
    organization: 'bg-purple-100 text-purple-700',
};

export default function EventsSetupPage({ events, terms, units, filters }: Props) {
    const { props } = usePage<{ auth: { user: { role: string; unit_id: string | null } }; flash?: { success?: string } }>();
    const { user } = props.auth;
    const flash = props.flash;

    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; event?: Event }>({ open: false, mode: 'create' });
    const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [scopeFilter, setScopeFilter] = useState(filters.scope ?? '');
    const [termFilter, setTermFilter] = useState(filters.term_id ?? '');

    function applyFilters() {
        router.get('/events/setup', { search, scope: scopeFilter, term_id: termFilter }, { preserveState: true, replace: true });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/events/${deleteTarget.event_id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    const currentTerm = terms.find(t => t.is_current);

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Event Setup" />
            <div className="mb-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left sm:gap-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Event Setup</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Configure and manage engagement events.
                        {currentTerm && <span className="ml-2 font-medium text-indigo-600 block sm:inline">Current: {currentTerm.academic_year} {currentTerm.semester} Semester</span>}
                    </p>
                </div>
                <Button onClick={() => setModal({ open: true, mode: 'create' })} className="bg-indigo-900 text-white hover:bg-indigo-800 gap-1.5 w-full sm:w-auto">
                    <Plus className="h-4 w-4" /> Create Event
                </Button>
            </div>

            {flash?.success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:justify-start">
                <Input placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} className="w-48" />
                <select value={scopeFilter} onChange={e => setScopeFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Scopes</option>
                    {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={termFilter} onChange={e => setTermFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Terms</option>
                    {terms.map(t => <option key={t.term_id} value={t.term_id}>{t.academic_year} {t.semester}</option>)}
                </select>
                <Button variant="outline" onClick={applyFilters}>Filter</Button>
                {(search || scopeFilter || termFilter) && (
                    <Button variant="ghost" onClick={() => { setSearch(''); setScopeFilter(''); setTermFilter(''); router.get('/events/setup'); }} className="text-slate-500">Clear</Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Title</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Scope</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Term</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Unit</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <Deferred data="events" fallback={<TableSkeleton rows={5} columns={6} />}>
                            {(!events || events.data.length === 0) ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No events found.</td></tr>
                            ) : events.data.map(event => (
                                <tr key={event.event_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        <button 
                                            onClick={() => router.get('/attendance', { event_id: event.event_id })}
                                            className="text-left hover:text-indigo-600 hover:underline transition-colors block"
                                        >
                                            {event.title}
                                        </button>
                                        {event.activity_program && <p className="text-xs text-slate-400">{event.activity_program}</p>}
                                        {event.point_overrides && event.point_overrides.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {event.point_overrides.map(o => (
                                                    <span key={o.override_id} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1 rounded uppercase font-bold">
                                                        {o.participation_role}: {o.points_awarded} pts
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${SCOPE_COLORS[event.scope]}`}>
                                            {event.scope}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {event.term ? `${event.term.academic_year} ${event.term.semester}` : event.term_id}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {event.unit?.unit_name ?? event.unit_id}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" title="View Attendance" onClick={() => router.get('/attendance', { event_id: event.event_id })}><ClipboardList className="h-4 w-4 text-indigo-600" /></Button>
                                            <Button size="icon" variant="ghost" title="Edit Event" onClick={() => setModal({ open: true, mode: 'edit', event })}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                            <Button size="icon" variant="ghost" title="Archive Event" onClick={() => setDeleteTarget(event)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {events && events.total > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Showing {events.from}–{events.to || 0} of {events.total}</span>
                    <div className="flex gap-1">
                        {events.links.map((link, i) => (
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

            {modal.open && (
                <EventModal mode={modal.mode} event={modal.event} terms={terms} units={units}
                    userRole={user.role} userUnitId={user.unit_id}
                    onClose={() => setModal(m => ({ ...m, open: false }))} />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold">Archive Event?</h2>
                        <p className="mb-5 text-sm text-slate-600">Archive <span className="font-medium">{deleteTarget.title}</span>? Attendance data is preserved.</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>Archive</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

EventsSetupPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/events/setup' },
    ],
};

function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50">
                    {Array.from({ length: columns }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

