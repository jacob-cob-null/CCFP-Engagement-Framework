<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\OrganizationalUnit;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with('unit');

        // Search by name or employee number
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('employee_name', 'ilike', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }

        if ($type = $request->get('personnel_type')) {
            $query->where('personnel_type', $type);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        // Scope: college_rep / org_rep only sees their unit
        $user = Auth::user();
        if ($user->role !== 'ccfp_admin') {
            $query->where('unit_id', $user->unit_id);
        } elseif ($unitId = $request->get('unit_id')) {
            $query->where('unit_id', $unitId);
        }

        $query->whereNull('deleted_at');

        $employees = $query->orderBy('employee_name')->paginate(25)->withQueryString();
        $units = OrganizationalUnit::active()->orderBy('unit_name')->get(['unit_id', 'unit_name', 'unit_type']);

        return Inertia::render('employee', [
            'employees' => $employees,
            'units'     => $units,
            'filters'   => $request->only(['search', 'personnel_type', 'status', 'unit_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_number' => 'required|integer|unique:employees,employee_number',
            'employee_name'   => 'required|string|max:255',
            'personnel_type'  => 'required|in:teaching,non-teaching',
            'unit_id'         => 'required|exists:organizational_units,unit_id',
            'status'          => 'sometimes|in:active,inactive',
        ]);

        $validated['employee_id'] = (string) Str::uuid();
        $validated['status'] = $validated['status'] ?? 'active';

        $employee = Employee::create($validated);

        AuditService::log(
            actionType:  'create_employee',
            targetId:    $employee->employee_id,
            description: "Created employee: {$employee->employee_name} (#{$employee->employee_number}).",
            metadata:    $validated,
        );

        return redirect()->route('employee.index')
            ->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, string $id)
    {
        $employee = Employee::where('employee_id', $id)->firstOrFail();

        $validated = $request->validate([
            'employee_number' => "required|integer|unique:employees,employee_number,{$employee->employee_number},employee_number",
            'employee_name'   => 'required|string|max:255',
            'personnel_type'  => 'required|in:teaching,non-teaching',
            'unit_id'         => 'required|exists:organizational_units,unit_id',
            'status'          => 'required|in:active,inactive',
        ]);

        $before = $employee->only(['employee_name', 'employee_number', 'personnel_type', 'unit_id', 'status']);
        $employee->update($validated);

        AuditService::log(
            actionType:  'update_employee',
            targetId:    $id,
            description: "Updated employee: {$employee->employee_name}.",
            metadata:    ['before' => $before, 'after' => $validated],
        );

        return redirect()->route('employee.index')
            ->with('success', 'Employee updated successfully.');
    }

    public function destroy(string $id)
    {
        $employee = Employee::where('employee_id', $id)
            ->whereNull('deleted_at')
            ->firstOrFail();

        $employee->update([
            'deleted_at'  => now(),
            'is_archived' => true,
            'status'      => 'inactive',
        ]);

        AuditService::log(
            actionType:  'delete_employee',
            targetId:    $id,
            description: "Soft-deleted employee: {$employee->employee_name} (#{$employee->employee_number}).",
            metadata:    ['name' => $employee->employee_name, 'number' => $employee->employee_number],
        );

        return redirect()->route('employee.index')
            ->with('success', 'Employee archived successfully.');
    }
}
