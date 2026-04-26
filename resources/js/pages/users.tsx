import { Head, Link, router, useForm, usePage, Deferred } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrganizationalUnit, Paginated, Profile, UserRole } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
    users?: Paginated<Profile>;
    units: OrganizationalUnit[];
    filters: { search?: string; role?: string; unit_id?: string };
};

type UserFormData = {
    name: string;
    email: string;
    password: string;
    role: UserRole | '';
    unit_id: string;
};

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'ccfp_admin', label: 'CCFP Admin' },
    { value: 'college_rep', label: 'College Representative' },
    { value: 'org_rep', label: 'Org Representative' },
];

const ROLE_REQUIRES_UNIT: UserRole[] = ['college_rep', 'org_rep'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
    const styles: Record<UserRole, string> = {
        ccfp_admin:  'bg-indigo-100 text-indigo-800',
        college_rep: 'bg-emerald-100 text-emerald-800',
        org_rep:     'bg-amber-100  text-amber-800',
    };
    const labels: Record<UserRole, string> = {
        ccfp_admin:  'CCFP Admin',
        college_rep: 'College Rep',
        org_rep:     'Org Rep',
    };
    return (
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${styles[role]}`}>
            {labels[role]}
        </span>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalProps = {
    mode: 'create' | 'edit';
    user?: Profile;
    units: OrganizationalUnit[];
    onClose: () => void;
};

function UserModal({ mode, user, units, onClose }: ModalProps) {
    const { data, setData, post, patch, processing, errors, reset } = useForm<UserFormData>({
        name:     user?.user_name  ?? '',
        email:    user?.user_email ?? '',
        password: '',
        role:     (user?.role ?? '') as UserRole | '',
        unit_id:  user?.unit_id    ?? '',
    });

    const needsUnit = ROLE_REQUIRES_UNIT.includes(data.role as UserRole);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (mode === 'create') {
            post('/users', {
                onSuccess: () => { reset(); onClose(); },
            });
        } else {
            patch(`/users/${user!.user_id}`, {
                onSuccess: () => onClose(),
            });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {mode === 'create' ? 'Add New User' : 'Edit User'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {/* Name */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="user-name">Full Name</Label>
                        <Input
                            id="user-name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Juan dela Cruz"
                            required
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Email — read-only on edit */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="user-email">Email Address</Label>
                        <Input
                            id="user-email"
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="user@institution.edu"
                            required
                            disabled={mode === 'edit'}
                            className={mode === 'edit' ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* Password — only on create */}
                    {mode === 'create' && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="user-password">Password</Label>
                            <Input
                                id="user-password"
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="Min. 8 characters"
                                required
                            />
                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                        </div>
                    )}

                    {/* Role */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="user-role">Role</Label>
                        <select
                            id="user-role"
                            value={data.role}
                            onChange={e => setData('role', e.target.value as UserRole)}
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="" disabled>Select a role…</option>
                            {ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                    </div>

                    {/* Unit — conditional on role */}
                    {needsUnit && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="user-unit">Organizational Unit</Label>
                            <select
                                id="user-unit"
                                value={data.unit_id}
                                onChange={e => setData('unit_id', e.target.value)}
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="" disabled>Select a unit…</option>
                                {units.map(u => (
                                    <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>
                                ))}
                            </select>
                            {errors.unit_id && <p className="text-xs text-red-500">{errors.unit_id}</p>}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-900 text-white hover:bg-indigo-800">
                            {processing ? 'Saving…' : mode === 'create' ? 'Create User' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage({ users, units, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; user?: Profile }>({
        open: false,
        mode: 'create',
    });
    const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

    // ── Filter form ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters.role ?? '');
    const [unitFilter, setUnitFilter] = useState(filters.unit_id ?? '');

    function applyFilters() {
        router.get('/users', { search, role: roleFilter, unit_id: unitFilter }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    }

    function clearFilters() {
        setSearch(''); setRoleFilter(''); setUnitFilter('');
        router.get('/users', {}, { preserveState: false });
    }

    // ── Delete confirmation ──────────────────────────────────────────────────
    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/users/${deleteTarget.user_id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="User Management" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage system accounts, roles, and unit assignments.
                    </p>
                </div>
                <Button
                    onClick={() => setModal({ open: true, mode: 'create' })}
                    className="bg-indigo-900 text-white hover:bg-indigo-800 gap-1.5"
                >
                    <Plus className="h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Flash message */}
            {flash?.success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {flash.success}
                </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Input
                    placeholder="Search name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                    className="w-56"
                />
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select
                    value={unitFilter}
                    onChange={e => setUnitFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Units</option>
                    {units.map(u => <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>)}
                </select>
                <Button variant="outline" onClick={applyFilters} className="h-10">Filter</Button>
                {(search || roleFilter || unitFilter) && (
                    <Button variant="ghost" onClick={clearFilters} className="h-10 text-slate-500">
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Unit</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <Deferred data="users" fallback={<UserSkeleton rows={5} columns={6} />}>
                            {(!users || users.data.length === 0) ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map(user => (
                                    <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">{user.user_name}</td>
                                        <td className="px-4 py-3 text-slate-600">{user.user_email}</td>
                                        <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                                        <td className="px-4 py-3 text-slate-600">{user.unit_id ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            {user.deleted_at ? (
                                                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">
                                                    Deactivated
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    title="Edit user"
                                                    onClick={() => setModal({ open: true, mode: 'edit', user })}
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                {!user.deleted_at && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        title="Deactivate user"
                                                        onClick={() => setDeleteTarget(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-400" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </Deferred>
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {users && users.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>
                        Showing {users.from}–{users.to} of {users.total} users
                    </span>
                    <div className="flex gap-1">
                        {users.links.map((link, i) => (
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`rounded px-3 py-1.5 border text-sm transition-colors ${
                                        link.active
                                            ? 'bg-indigo-900 text-white border-indigo-900'
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
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

            {/* Create / Edit Modal */}
            {modal.open && (
                <UserModal
                    mode={modal.mode}
                    user={modal.user}
                    units={units}
                    onClose={() => setModal(m => ({ ...m, open: false }))}
                />
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold text-slate-900">Deactivate User?</h2>
                        <p className="mb-5 text-sm text-slate-600">
                            This will revoke access for{' '}
                            <span className="font-medium">{deleteTarget.user_email}</span>.
                            Their data will be preserved (soft-delete).
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={confirmDelete}
                            >
                                Deactivate
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

UsersPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'User Management', href: '/users' },
    ],
};

function UserSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
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
