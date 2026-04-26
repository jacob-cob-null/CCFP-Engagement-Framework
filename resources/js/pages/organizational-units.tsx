import { Head, router, useForm, Deferred } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrganizationalUnit, Paginated } from '@/types';

type Props = {
    units?: Paginated<OrganizationalUnit>;
    filters: { search?: string; type?: string };
};

type UnitForm = { unit_id: string; unit_name: string; unit_type: 'college' | 'organization' | '' };

const UNIT_TYPES = [
    { value: 'college', label: 'College' },
    { value: 'organization', label: 'Organization' },
];

function UnitModal({ mode, unit, onClose }: { mode: 'create' | 'edit'; unit?: OrganizationalUnit; onClose: () => void }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm<UnitForm>({
        unit_id:   unit?.unit_id   ?? '',
        unit_name: unit?.unit_name ?? '',
        unit_type: (unit?.unit_type ?? '') as UnitForm['unit_type'],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (mode === 'create') {
            post('/organizational-units', { onSuccess: () => { reset(); onClose(); } });
        } else {
            patch(`/organizational-units/${unit!.unit_id}`, { onSuccess: () => onClose() });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{mode === 'create' ? 'Add Unit' : 'Edit Unit'}</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    {mode === 'create' && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="uid">Unit ID <span className="text-xs text-slate-400">(e.g. CCS)</span></Label>
                            <Input id="uid" value={data.unit_id} onChange={e => setData('unit_id', e.target.value.toUpperCase())} placeholder="CCS" required />
                            {errors.unit_id && <p className="text-xs text-red-500">{errors.unit_id}</p>}
                        </div>
                    )}
                    <div className="grid gap-1.5">
                        <Label htmlFor="uname">Unit Name</Label>
                        <Input id="uname" value={data.unit_name} onChange={e => setData('unit_name', e.target.value)} placeholder="College of Computer Studies" required />
                        {errors.unit_name && <p className="text-xs text-red-500">{errors.unit_name}</p>}
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="utype">Unit Type</Label>
                        <select id="utype" value={data.unit_type} onChange={e => setData('unit_type', e.target.value as UnitForm['unit_type'])}
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required>
                            <option value="" disabled>Select type…</option>
                            {UNIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {errors.unit_type && <p className="text-xs text-red-500">{errors.unit_type}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-900 text-white hover:bg-indigo-800">
                            {processing ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function OrganizationalUnitsPage({ units, filters }: Props) {
    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; unit?: OrganizationalUnit }>({ open: false, mode: 'create' });
    const [deleteTarget, setDeleteTarget] = useState<OrganizationalUnit | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.type ?? '');

    function applyFilters() {
        router.get('/organizational-units', { search, type: typeFilter }, { preserveState: true, replace: true });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/organizational-units/${deleteTarget.unit_id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Organizational Units" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organizational Units</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage colleges and organizations tracked in the system.</p>
                </div>
                <Button onClick={() => setModal({ open: true, mode: 'create' })} className="bg-indigo-900 text-white hover:bg-indigo-800 gap-1.5">
                    <Plus className="h-4 w-4" /> Add Unit
                </Button>
            </div>

            <div className="mb-4 flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Input placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} className="w-56" />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Types</option>
                    {UNIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <Button variant="outline" onClick={applyFilters}>Filter</Button>
                {(search || typeFilter) && <Button variant="ghost" onClick={() => { setSearch(''); setTypeFilter(''); router.get('/organizational-units'); }} className="text-slate-500">Clear</Button>}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Unit ID</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <Deferred data="units" fallback={<UnitSkeleton rows={5} columns={4} />}>
                            {(!units || units.data.length === 0) ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No units found.</td></tr>
                            ) : units.data.map(unit => (
                                <tr key={unit.unit_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{unit.unit_id}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{unit.unit_name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${unit.unit_type === 'college' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {unit.unit_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setModal({ open: true, mode: 'edit', unit })}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(unit)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {modal.open && <UnitModal mode={modal.mode} unit={modal.unit} onClose={() => setModal(m => ({ ...m, open: false }))} />}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold">Archive Unit?</h2>
                        <p className="mb-5 text-sm text-slate-600">Archive <span className="font-medium">{deleteTarget.unit_name}</span>? This is a soft delete — data is preserved.</p>
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

OrganizationalUnitsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Organizational Units', href: '/organizational-units' },
    ],
};

function UnitSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
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
