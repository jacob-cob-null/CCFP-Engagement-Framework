import { Head, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PointPolicy, ParticipationRole } from '@/types';

type Props = { policies: PointPolicy[] };

type PolicyForm = {
    participation_role: ParticipationRole | '';
    default_points: number;
};

const ROLES: { value: ParticipationRole; label: string; desc: string }[] = [
    { value: 'participant', label: 'Participant', desc: 'Regular attendee' },
    { value: 'organizer',   label: 'Organizer',   desc: 'Organizing committee member' },
    { value: 'donor',       label: 'Donor',        desc: 'Donation contributor' },
];

function PolicyModal({ mode, policy, onClose }: { mode: 'create' | 'edit'; policy?: PointPolicy; onClose: () => void }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm<PolicyForm>({
        participation_role: (policy?.participation_role ?? '') as PolicyForm['participation_role'],
        default_points:     policy?.default_points ?? 1,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (mode === 'create') {
            post('/point-policies', { onSuccess: () => { reset(); onClose(); } });
        } else {
            patch(`/point-policies/${policy!.policy_id}`, { onSuccess: () => onClose() });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{mode === 'create' ? 'Add Point Policy' : 'Edit Policy'}</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    {mode === 'create' && (
                        <div className="grid gap-1.5">
                            <Label>Participation Role</Label>
                            <select value={data.participation_role} onChange={e => setData('participation_role', e.target.value as ParticipationRole)}
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required>
                                <option value="" disabled>Select role…</option>
                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                            </select>
                            {errors.participation_role && <p className="text-xs text-red-500">{errors.participation_role}</p>}
                        </div>
                    )}
                    {mode === 'edit' && (
                        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            Role: <span className="font-medium capitalize">{policy?.participation_role}</span>
                        </div>
                    )}
                    <div className="grid gap-1.5">
                        <Label htmlFor="pts">Default Points</Label>
                        <Input id="pts" type="number" min={0} value={data.default_points}
                            onChange={e => setData('default_points', parseInt(e.target.value) || 0)} required />
                        {errors.default_points && <p className="text-xs text-red-500">{errors.default_points}</p>}
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

export default function PointPoliciesPage({ policies }: Props) {
    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; policy?: PointPolicy }>({ open: false, mode: 'create' });
    const [deleteTarget, setDeleteTarget] = useState<PointPolicy | null>(null);

    const existingRoles = new Set(policies.map(p => p.participation_role));
    const allRolesDefined = ROLES.every(r => existingRoles.has(r.value));

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/point-policies/${deleteTarget.policy_id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Point Policies" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Point Policies</h1>
                    <p className="mt-1 text-sm text-slate-500">Configure default point values per participation role.</p>
                </div>
                {!allRolesDefined && (
                    <Button onClick={() => setModal({ open: true, mode: 'create' })} className="bg-indigo-900 text-white hover:bg-indigo-800 gap-1.5">
                        <Plus className="h-4 w-4" /> Add Policy
                    </Button>
                )}
            </div>

            {allRolesDefined && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    ✓ All participation roles have point policies defined.
                </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Description</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Default Points</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {policies.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No policies defined yet.</td></tr>
                        ) : policies.map(policy => {
                            const roleInfo = ROLES.find(r => r.value === policy.participation_role);
                            return (
                                <tr key={policy.policy_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium capitalize text-slate-900">{policy.participation_role}</td>
                                    <td className="px-4 py-3 text-slate-500">{roleInfo?.desc}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                                            {policy.default_points} pt{policy.default_points !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setModal({ open: true, mode: 'edit', policy })}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(policy)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {modal.open && <PolicyModal mode={modal.mode} policy={modal.policy} onClose={() => setModal(m => ({ ...m, open: false }))} />}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold">Delete Policy?</h2>
                        <p className="mb-5 text-sm text-slate-600">Remove the <span className="font-medium capitalize">{deleteTarget.participation_role}</span> policy ({deleteTarget.default_points} pts)?</p>
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

PointPoliciesPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Point Policies', href: '/point-policies' },
    ],
};
