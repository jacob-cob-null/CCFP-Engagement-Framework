import { Head, router, useForm, Deferred } from '@inertiajs/react';
import { UnitTableRowsSkeleton } from '@/components/skeletons/organizational-units-skeleton';
import { Pencil, Plus, Trash2, X, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
        <div className="flex flex-col flex-1 p-4 sm:p-8 bg-[#fafafa] min-h-screen">
            <Head title="Organizational Units" />
            <div className="mb-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left sm:gap-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organizational Units</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage colleges and organizations tracked in the system.</p>
                </div>
                <Button onClick={() => setModal({ open: true, mode: 'create' })} className="bg-indigo-900 text-white hover:bg-indigo-800 gap-1.5 w-full sm:w-auto">
                    <Plus className="h-4 w-4" /> Add Unit
                </Button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Input placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} className="w-full sm:w-56" />
                <div className="flex w-full gap-2 sm:w-auto">
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto sm:flex-none">
                        <option value="">All Types</option>
                        {UNIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <Button variant="outline" onClick={applyFilters} className="flex-1 sm:flex-none">Filter</Button>
                </div>
                {(search || typeFilter) && <Button variant="ghost" onClick={() => { setSearch(''); setTypeFilter(''); router.get('/organizational-units'); }} className="w-full sm:w-auto text-slate-500">Clear</Button>}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
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
                        <Deferred data="units" fallback={<UnitTableRowsSkeleton rows={5} columns={4} />}>
                            {(!units || units.data.length === 0) ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No units found.</td></tr>
                            ) : units.data.map(unit => (
                                <tr key={unit.unit_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{unit.unit_id}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{unit.unit_name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center capitalize rounded px-2 py-0.5 text-xs font-medium ${unit.unit_type === 'college' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {unit.unit_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setModal({ open: true, mode: 'edit', unit })}>
                                                    <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                                                    <span>Edit Unit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteTarget(unit)} variant="destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Archive Unit</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {units && units.total > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Showing {units.from || 0}–{units.to || 0} of {units.total}</span>
                    <div className="flex gap-1">
                        {units.links.map((link, i) => (
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


