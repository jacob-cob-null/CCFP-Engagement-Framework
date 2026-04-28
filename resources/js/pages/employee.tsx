import { Head, router, useForm, usePage, Deferred } from '@inertiajs/react';
import { EmployeeTableRowsSkeleton } from '@/components/skeletons/employee-skeleton';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    Employee,
    OrganizationalUnit,
    Paginated,
    PersonnelType,
} from '@/types';

type Props = {
    employees?: Paginated<Employee>;
    units: OrganizationalUnit[];
    filters: {
        search?: string;
        personnel_type?: string;
        status?: string;
        unit_id?: string;
    };
};

type LeaderboardEntry = {
    employee_id: string;
    term_id: string;
    total_points: number;
    last_calculated_at: string;
    employee: {
        employee_name: string;
        employee_number: number;
        personnel_type: string;
        unit?: { unit_name: string; unit_id: string };
    };
};

type PointsProps = {
    leaderboard?: Paginated<LeaderboardEntry>;
    terms: {
        term_id: string;
        academic_year: string;
        semester: string;
        is_current?: boolean;
    }[];
    pointsFilters: {
        search?: string;
        term_id?: string;
        unit_id?: string;
        personnel_type?: string;
    };
};

type EmployeeForm = {
    employee_number: string;
    employee_name: string;
    personnel_type: PersonnelType | '';
    unit_id: string;
    status: 'active' | 'inactive';
};

const PERSONNEL_TYPES = [
    { value: 'teaching', label: 'Teaching' },
    { value: 'non_teaching', label: 'Non-Teaching' },
];

function EmployeeModal({
    mode,
    employee,
    units,
    onClose,
}: {
    mode: 'create' | 'edit';
    employee?: Employee;
    units: OrganizationalUnit[];
    onClose: () => void;
}) {
    const { data, setData, post, patch, processing, errors, reset } =
        useForm<EmployeeForm>({
            employee_number: employee?.employee_number?.toString() ?? '',
            employee_name: employee?.employee_name ?? '',
            personnel_type: (employee?.personnel_type ??
                '') as EmployeeForm['personnel_type'],
            unit_id: employee?.unit_id ?? '',
            status: employee?.status ?? 'active',
        });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (mode === 'create') {
            post('/employee', {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            patch(`/employee/${employee!.employee_id}`, {
                onSuccess: () => onClose(),
            });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {mode === 'create' ? 'Add Employee' : 'Edit Employee'}
                    </h2>
                    <button onClick={onClose}>
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="enum">Employee Number</Label>
                            <Input
                                id="enum"
                                type="number"
                                value={data.employee_number}
                                onChange={(e) =>
                                    setData('employee_number', e.target.value)
                                }
                                placeholder="12345"
                                required
                            />
                            {errors.employee_number && (
                                <p className="text-xs text-red-500">
                                    {errors.employee_number}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="etype">Personnel Type</Label>
                            <select
                                id="etype"
                                value={data.personnel_type}
                                onChange={(e) =>
                                    setData(
                                        'personnel_type',
                                        e.target.value as PersonnelType,
                                    )
                                }
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="" disabled>
                                    Select…
                                </option>
                                {PERSONNEL_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            {errors.personnel_type && (
                                <p className="text-xs text-red-500">
                                    {errors.personnel_type}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="ename">Full Name</Label>
                        <Input
                            id="ename"
                            value={data.employee_name}
                            onChange={(e) =>
                                setData('employee_name', e.target.value)
                            }
                            placeholder="Juan dela Cruz"
                            required
                        />
                        {errors.employee_name && (
                            <p className="text-xs text-red-500">
                                {errors.employee_name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="eunit">College / Unit</Label>
                        <select
                            id="eunit"
                            value={data.unit_id}
                            onChange={(e) => setData('unit_id', e.target.value)}
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="" disabled>
                                Select unit…
                            </option>
                            {units.map((u) => (
                                <option key={u.unit_id} value={u.unit_id}>
                                    {u.unit_name}
                                </option>
                            ))}
                        </select>
                        {errors.unit_id && (
                            <p className="text-xs text-red-500">
                                {errors.unit_id}
                            </p>
                        )}
                    </div>
                    {mode === 'edit' && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="estatus">Status</Label>
                            <select
                                id="estatus"
                                value={data.status}
                                onChange={(e) =>
                                    setData(
                                        'status',
                                        e.target.value as 'active' | 'inactive',
                                    )
                                }
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    )}
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
                            {processing
                                ? 'Saving…'
                                : mode === 'create'
                                  ? 'Create'
                                  : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function EmployeePage({
    employees,
    units,
    filters,
    leaderboard,
    terms,
    pointsFilters,
}: Props & Partial<PointsProps>) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    const [modal, setModal] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        employee?: Employee;
    }>({ open: false, mode: 'create' });
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.personnel_type ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [unitFilter, setUnitFilter] = useState(filters.unit_id ?? '');

    function applyFilters() {
        router.get(
            '/employee',
            {
                search,
                personnel_type: typeFilter,
                status: statusFilter,
                unit_id: unitFilter,
            },
            { preserveState: true, replace: true },
        );
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/employee/${deleteTarget.employee_id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <div className="flex min-h-screen flex-1 flex-col bg-[#fafafa] p-8">
            <Head title="Employee Management" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Employee Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage full-time employee profiles. Total:{' '}
                        {employees?.total ?? 0}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setModal({ open: true, mode: 'create' })}
                        className="gap-1.5 bg-indigo-900 text-white hover:bg-indigo-800"
                    >
                        <Plus className="h-4 w-4" /> Add Employee
                    </Button>
                </div>
            </div>

            {flash?.success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {flash.success}
                </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Input
                    placeholder="Search name or number…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    className="w-56"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Types</option>
                    {PERSONNEL_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Units</option>
                    {units.map((u) => (
                        <option key={u.unit_id} value={u.unit_id}>
                            {u.unit_name}
                        </option>
                    ))}
                </select>
                <Button variant="outline" onClick={applyFilters}>
                    Filter
                </Button>
                {(search || typeFilter || statusFilter || unitFilter) && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearch('');
                            setTypeFilter('');
                            setStatusFilter('');
                            setUnitFilter('');
                            router.get('/employee');
                        }}
                        className="text-slate-500"
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Main content: employees table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                #
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Name
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Unit
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Points
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <Deferred
                            data="employees"
                            fallback={
                                <EmployeeTableRowsSkeleton
                                    rows={5}
                                    columns={7}
                                />
                            }
                        >
                            {!employees || employees.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-slate-400"
                                    >
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((emp) => (
                                    <tr
                                        key={emp.employee_id}
                                        className="transition-colors hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                            {emp.employee_number}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {emp.employee_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${emp.personnel_type === 'teaching' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                                            >
                                                {emp.personnel_type ===
                                                'non_teaching'
                                                    ? 'Non-Teaching'
                                                    : emp.personnel_type
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      emp.personnel_type.slice(
                                                          1,
                                                      )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {emp.unit?.unit_name ?? emp.unit_id}
                                        </td>
                                        <td className="flex justify-start px-4 py-3 text-left font-mono text-sm text-emerald-700">
                                            {(emp as any).total_points ?? 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                                            >
                                                {emp.status
                                                    .split('-')
                                                    .map(
                                                        (word) =>
                                                            word
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            word.slice(1),
                                                    )
                                                    .join('-')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setModal({
                                                            open: true,
                                                            mode: 'edit',
                                                            employee: emp,
                                                        })
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setDeleteTarget(emp)
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

            {/* Pagination */}
            {employees && employees.total > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>
                        Showing {employees.from}–{employees.to} of{' '}
                        {employees.total}
                    </span>
                    <div className="flex gap-1">
                        {employees.links.map((link, i) =>
                            link.url ? (
                                <a
                                    key={i}
                                    href={link.url}
                                    className={`rounded border px-3 py-1.5 text-sm transition-colors ${link.active ? 'border-indigo-900 bg-indigo-900 text-white' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="rounded border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm text-slate-300"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </div>
                </div>
            )}

            {modal.open && (
                <EmployeeModal
                    mode={modal.mode}
                    employee={modal.employee}
                    units={units}
                    onClose={() => setModal((m) => ({ ...m, open: false }))}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold">
                            Archive Employee?
                        </h2>
                        <p className="mb-5 text-sm text-slate-600">
                            Archive{' '}
                            <span className="font-medium">
                                {deleteTarget.employee_name}
                            </span>{' '}
                            (#{deleteTarget.employee_number})? Data is
                            preserved.
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
                                Archive
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

EmployeePage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Employees', href: '/employee' },
    ],
};

