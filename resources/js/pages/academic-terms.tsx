import { Head, router, useForm, Deferred } from '@inertiajs/react';
import { Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AcademicTerm } from '@/types';

type Props = { terms?: AcademicTerm[] };

type TermForm = {
    term_id: string;
    academic_year: string;
    semester: '1st' | '2nd' | 'summer' | '';
    start_date: string;
    end_date: string;
    is_current: boolean;
};

const SEMESTERS = [
    { value: '1st', label: '1st Semester' },
    { value: '2nd', label: '2nd Semester' },
    { value: 'summer', label: 'Summer' },
];

function TermModal({ mode, term, onClose }: { mode: 'create' | 'edit'; term?: AcademicTerm; onClose: () => void }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm<TermForm>({
        term_id:       term?.term_id       ?? '',
        academic_year: term?.academic_year ?? '',
        semester:      (term?.semester     ?? '') as TermForm['semester'],
        start_date:    term?.start_date    ?? '',
        end_date:      term?.end_date      ?? '',
        is_current:    term?.is_current    ?? false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (mode === 'create') {
            post('/academic-terms', { onSuccess: () => { reset(); onClose(); } });
        } else {
            patch(`/academic-terms/${term!.term_id}`, { onSuccess: () => onClose() });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{mode === 'create' ? 'Add Academic Term' : 'Edit Term'}</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    {mode === 'create' && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="tid">Term Start Date <span className="text-xs text-slate-400">(used as ID)</span></Label>
                            <Input id="tid" type="date" value={data.term_id} onChange={e => setData('term_id', e.target.value)} required />
                            {errors.term_id && <p className="text-xs text-red-500">{errors.term_id}</p>}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="ay">Academic Year</Label>
                            <Input id="ay" value={data.academic_year} onChange={e => setData('academic_year', e.target.value)} placeholder="2024-2025" required />
                            {errors.academic_year && <p className="text-xs text-red-500">{errors.academic_year}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="sem">Semester</Label>
                            <select id="sem" value={data.semester} onChange={e => setData('semester', e.target.value as TermForm['semester'])}
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required>
                                <option value="" disabled>Select…</option>
                                {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            {errors.semester && <p className="text-xs text-red-500">{errors.semester}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="sd">Start Date</Label>
                            <Input id="sd" type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} required />
                            {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="ed">End Date</Label>
                            <Input id="ed" type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} required />
                            {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_current} onChange={e => setData('is_current', e.target.checked)} className="rounded border-slate-300" />
                        Mark as current term
                    </label>
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

export default function AcademicTermsPage({ terms }: Props) {
    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; term?: AcademicTerm }>({ open: false, mode: 'create' });
    const [deleteTarget, setDeleteTarget] = useState<AcademicTerm | null>(null);

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/academic-terms/${deleteTarget.term_id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Academic Terms" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic Terms</h1>
                    <p className="mt-1 text-sm text-slate-500">Configure academic year and semester periods.</p>
                </div>
                <Button onClick={() => setModal({ open: true, mode: 'create' })} className="bg-indigo-900 text-white hover:bg-indigo-800 gap-1.5">
                    <Plus className="h-4 w-4" /> Add Term
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Academic Year</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Semester</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Start Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">End Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <Deferred data="terms" fallback={<TermSkeleton rows={5} columns={6} />}>
                            {(!terms || terms.length === 0) ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No terms configured yet.</td></tr>
                            ) : terms.map(term => (
                                <tr key={term.term_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900">{term.academic_year}</td>
                                    <td className="px-4 py-3 capitalize text-slate-600">{term.semester} Semester</td>
                                    <td className="px-4 py-3 text-slate-600">{term.start_date}</td>
                                    <td className="px-4 py-3 text-slate-600">{term.end_date}</td>
                                    <td className="px-4 py-3">
                                        {term.is_current ? (
                                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                                <Star className="h-3 w-3" /> Current
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">Past</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setModal({ open: true, mode: 'edit', term })}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(term)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {modal.open && <TermModal mode={modal.mode} term={modal.term} onClose={() => setModal(m => ({ ...m, open: false }))} />}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold">Delete Term?</h2>
                        <p className="mb-5 text-sm text-slate-600">Delete <span className="font-medium">{deleteTarget.academic_year} {deleteTarget.semester}</span>? This will fail if events reference it.</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

AcademicTermsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Academic Terms', href: '/academic-terms' },
    ],
};

function TermSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
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
