import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Employee, Event, ParticipationRole } from '@/types';
import { router, usePage } from '@inertiajs/react';

const ROLES: { value: ParticipationRole; label: string }[] = [
    { value: 'participant', label: 'Participant' },
    { value: 'organizer', label: 'Organizer' },
    { value: 'donor', label: 'Donor' },
];

export function RecordAttendancePanel({
    event,
    onClose,
}: {
    event: Event;
    onClose: () => void;
}) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        // Fetch all employees (org filter could be added later if needed)
        fetch('/api/attendance/employees')
            .then((res) => res.json())
            .then((data) => {
                setEmployees(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [event.unit_id]);

    const filteredEmployees = employees.filter((emp) =>
        emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        String(emp.employee_number || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl sm:h-[80vh]">
                <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
                    <div>
                        <h2 className="text-lg font-semibold">Record Attendance: {event.title}</h2>
                        <p className="text-sm text-slate-500">Select an employee to record their attendance</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="border-b px-4 py-3 sm:px-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search employee name or number..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    {loading ? (
                        <div className="p-6 text-center text-slate-500">Loading employees...</div>
                    ) : (
                        <div className="min-w-[500px]">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-600">Employee Name</th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-600">Employee No.</th>
                                    <th className="px-6 py-3 text-right font-semibold text-slate-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map((emp) => (
                                        <tr key={emp.employee_id} className="transition-colors hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-900">{emp.employee_name}</td>
                                            <td className="px-6 py-3 text-slate-500">{emp.employee_number || '-'}</td>
                                            <td className="px-6 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setSelectedEmployee(emp)}
                                                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    Record
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
                
                {!loading && filteredEmployees.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:gap-0 sm:px-6">
                        <span className="text-center text-xs text-slate-500 sm:text-sm sm:text-left">
                            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredEmployees.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length} entries
                        </span>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {selectedEmployee && (
                <RolePickerModal
                    event={event}
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                />
            )}
        </div>
    );
}

function RolePickerModal({
    event,
    employee,
    onClose,
}: {
    event: Event;
    employee: Employee;
    onClose: () => void;
}) {
    const [role, setRole] = useState<ParticipationRole>('participant');
    const [processing, setProcessing] = useState(false);
    const { errors } = usePage().props as unknown as { errors: Record<string, string> };

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);

        router.post('/api/attendance/record', {
            employee_id: employee.employee_id,
            event_id: event.event_id,
            role,
        }, {
            onSuccess: () => {
                onClose();
            },
            onFinish: () => {
                setProcessing(false);
            },
            preserveState: true,
            preserveScroll: true
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Select Role</h2>
                    <button onClick={onClose} disabled={processing}>
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>
                <div className="mb-4 text-sm text-slate-600">
                    Recording attendance for <span className="font-semibold text-slate-900">{employee.employee_name}</span>.
                </div>
                <form onSubmit={submit} className="space-y-4">
                    {errors.employee_id && (
                        <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">
                            {errors.employee_id}
                        </div>
                    )}
                    <div className="grid gap-1.5">
                        <Label htmlFor="role">Participation Role</Label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as ParticipationRole)}
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
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-900 text-white hover:bg-indigo-800">
                            {processing ? 'Recording…' : 'Confirm'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
