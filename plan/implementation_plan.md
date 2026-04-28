# Detailed Implementation Plan — DB/Code Alignment

## Root Cause Summary

Three PostgreSQL enum types in Supabase are misaligned with the application code:

| Enum              | DB Actual Values                         | Code Sends          | Impact                                   |
| ----------------- | ---------------------------------------- | ------------------- | ---------------------------------------- |
| `employee_status` | `active, on_leave, transferred, retired` | `inactive`          | 500 on edit/archive                      |
| `personnel_type`  | `teaching, non_teaching`                 | `non-teaching`      | 500 on create/edit, 0 results in filters |
| `action_type`     | 13 specific values                       | 24 different values | Silent audit log failure on every action |

**Strategy**: Minimize DB changes — adapt code to DB where possible. Only extend the DB schema when strictly unavoidable.

---

## Phase 1 — Supabase SQL Editor

> [!IMPORTANT]
> Run each `ALTER TYPE` statement **individually** in the Supabase SQL editor. PostgreSQL does not allow `ADD VALUE` inside a transaction block.

```sql
-- STEP 1.1 — Add missing employee_status value (UNAVOIDABLE schema change)
ALTER TYPE employee_status ADD VALUE IF NOT EXISTS 'inactive';

-- STEP 1.2 — Add missing action_type values for operations with no DB equivalent
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'event_deleted';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'user_deleted';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'employee_created';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'employee_updated';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'employee_deleted';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'term_created';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'term_updated';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'term_deleted';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'org_unit_created';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'org_unit_updated';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'org_unit_deleted';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'policy_created';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'policy_updated';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'policy_deleted';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'data_export';
```

> [!NOTE]
> `personnel_type` is **not changed**. The DB value `non_teaching` (underscore) is correct. Application code is updated to match.

---

## Phase 2 — PHP Backend (9 Controllers)

### 2.1 — `app/Http/Controllers/EmployeeController.php`

**Changes**: Fix `personnel_type` validation (2 locations) + fix all 3 audit action types.

```diff
# Line 122 — store() validation
-  'personnel_type'  => 'required|in:teaching,non-teaching',
+  'personnel_type'  => 'required|in:teaching,non_teaching',

# Line 133 — store() audit log
-  actionType:  'create_employee',
+  actionType:  'employee_created',

# Line 150 — update() validation
-  'personnel_type'  => 'required|in:teaching,non-teaching',
+  'personnel_type'  => 'required|in:teaching,non_teaching',

# Line 159 — update() audit log
-  actionType:  'update_employee',
+  actionType:  'employee_updated',

# Line 182 — destroy() audit log
-  actionType:  'delete_employee',
+  actionType:  'employee_deleted',
```

> [!NOTE]
> The `status => 'inactive'` in `destroy()` (line 178) will work correctly once Phase 1 Step 1.1 is run. No code change needed there.

---

### 2.2 — `app/Http/Controllers/AttendanceController.php`

**Changes**: Remap 3 audit action types to existing DB enum values.

```diff
# Line 116 — store() audit log
-  actionType:  'create_attendance',
+  actionType:  'attendance_recorded',

# Line 155 — update() audit log
-  actionType:  'update_attendance',
+  actionType:  'attendance_edited',

# Line 180 — destroy() audit log
-  actionType:  'delete_attendance',
+  actionType:  'attendance_deleted',
```

---

### 2.3 — `app/Http/Controllers/LiveAttendanceController.php`

**Changes**: Remap 1 audit action type.

```diff
# Line 119 — store() audit log
-  actionType:  'create_attendance_live',
+  actionType:  'attendance_recorded',
```

---

### 2.4 — `app/Http/Controllers/EventController.php`

**Changes**: Remap 2 audit action types + add the new `event_deleted` value.

```diff
# Line 103 — store() audit log
-  actionType:  'create_event',
+  actionType:  'event_created',

# Line 154 — update() audit log
-  actionType:  'update_event',
+  actionType:  'event_edited',

# Line 174 — destroy() audit log
-  actionType:  'delete_event',
+  actionType:  'event_deleted',
```

---

### 2.5 — `app/Http/Controllers/AdminUserController.php`

**Changes**: Remap 2 audit action types + add the new `user_deleted` value.

```diff
# Line 136 — store() audit log
-  actionType:  'create_user',
+  actionType:  'user_created',

# Line 176 — update() audit log
-  actionType:  'update_user',
+  actionType:  'profile_updated',

# Line 205 — destroy() audit log
-  actionType:  'delete_user',
+  actionType:  'user_deleted',
```

---

### 2.6 — `app/Http/Controllers/AcademicTermController.php`

**Changes**: Remap 3 audit action types.

```diff
# Line 47 — store() audit log
-  actionType:  'create_academic_term',
+  actionType:  'term_created',

# Line 81 — update() audit log
-  actionType:  'update_academic_term',
+  actionType:  'term_updated',

# Line 107 — destroy() audit log
-  actionType:  'delete_academic_term',
+  actionType:  'term_deleted',
```

---

### 2.7 — `app/Http/Controllers/OrganizationalUnitController.php`

**Changes**: Remap 3 audit action types.

```diff
# Line 84 — store() audit log
-  actionType:  'create_org_unit',
+  actionType:  'org_unit_created',

# Line 109 — update() audit log
-  actionType:  'update_org_unit',
+  actionType:  'org_unit_updated',

# Line 133 — destroy() audit log
-  actionType:  'delete_org_unit',
+  actionType:  'org_unit_deleted',
```

---

### 2.8 — `app/Http/Controllers/PointPolicyController.php`

**Changes**: Remap 3 audit action types.

```diff
# Line 40 — store() audit log
-  actionType:  'create_point_policy',
+  actionType:  'policy_created',

# Line 64 — update() audit log
-  actionType:  'update_point_policy',
+  actionType:  'policy_updated',

# Line 84 — destroy() audit log
-  actionType:  'delete_point_policy',
+  actionType:  'policy_deleted',
```

---

### 2.9 — `app/Http/Controllers/ExportController.php`

**Changes**: Consolidate 3 audit action types to the single new `data_export` value.

```diff
# Line 29 — employees() audit log
-  actionType: 'export_employees',
+  actionType: 'data_export',

# Line 77 — attendance() audit log
-  actionType: 'export_attendance',
+  actionType: 'data_export',

# Line 128 — points() audit log
-  actionType: 'export_points',
+  actionType: 'data_export',
```

---

### 2.10 — `app/Http/Controllers/DashboardController.php`

**Changes**: Fix the non-teaching key lookup that currently always returns 0.

```diff
# Line 121 — breakdownsClosure — wrong key
-  'non_teaching' => $byType['non-teaching'] ?? 0,
+  'non_teaching' => $byType['non_teaching'] ?? 0,
```

---

## Phase 3 — Frontend TypeScript / TSX (3 Files)

### 3.1 — `resources/js/types/domain.ts`

**Changes**: Update `PersonnelType` to match the DB underscore format.

```diff
# Line 8
- export type PersonnelType = 'teaching' | 'non-teaching';
+ export type PersonnelType = 'teaching' | 'non_teaching';
```

---

### 3.2 — `resources/js/pages/employee.tsx`

**Changes**: Update the `PERSONNEL_TYPES` constant value and the existing title-case badge transform.

```diff
# Line 65 — PERSONNEL_TYPES constant
- { value: 'non-teaching', label: 'Non-Teaching' },
+ { value: 'non_teaching', label: 'Non-Teaching' },
```

The title-case badge transform on line 441 uses `.split('-')` which splits on hyphens. Since `non_teaching` uses an underscore, update the transform:

```diff
# Line 441 — personnel_type badge in table
- {emp.personnel_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')}
+ {emp.personnel_type === 'non_teaching' ? 'Non-Teaching' : emp.personnel_type.charAt(0).toUpperCase() + emp.personnel_type.slice(1)}
```

> [!NOTE]
> The status badge transform on line 454 (`emp.status.split('-')...`) is unaffected since `active`/`inactive` use no hyphens.

---

### 3.3 — `resources/js/pages/employee-points.tsx`

**Changes**: Update the filter dropdown value and the badge display transform.

```diff
# Line 107 — personnel_type filter option
- <option value="non-teaching">Non-Teaching</option>
+ <option value="non_teaching">Non-Teaching</option>
```

```diff
# Line 154 — personnel_type badge (already uses the title-case transform added previously)
- {entry.employee.personnel_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')}
+ {entry.employee.personnel_type === 'non_teaching' ? 'Non-Teaching' : entry.employee.personnel_type.charAt(0).toUpperCase() + entry.employee.personnel_type.slice(1)}
```

---

## Execution Order

| Step | File/Location                      | Type       | Priority       |
| ---- | ---------------------------------- | ---------- | -------------- |
| 1    | Supabase SQL Editor                | DB schema  | 🔴 Do first    |
| 2    | `EmployeeController.php`           | PHP        | 🔴 Critical    |
| 3    | `AttendanceController.php`         | PHP        | 🔴 Critical    |
| 4    | `LiveAttendanceController.php`     | PHP        | 🔴 Critical    |
| 5    | `EventController.php`              | PHP        | 🔴 Critical    |
| 6    | `AdminUserController.php`          | PHP        | 🔴 Critical    |
| 7    | `AcademicTermController.php`       | PHP        | 🟡 Audit fix   |
| 8    | `OrganizationalUnitController.php` | PHP        | 🟡 Audit fix   |
| 9    | `PointPolicyController.php`        | PHP        | 🟡 Audit fix   |
| 10   | `ExportController.php`             | PHP        | 🟡 Audit fix   |
| 11   | `DashboardController.php`          | PHP        | 🟡 Data bug    |
| 12   | `domain.ts`                        | TypeScript | 🟢 Type safety |
| 13   | `employee.tsx`                     | TSX        | 🟢 UI          |
| 14   | `employee-points.tsx`              | TSX        | 🟢 UI          |

---

## Verification Checklist

After all changes, verify:

- [ ] Create a **Non-Teaching** employee → no 500 error
- [ ] Edit an employee → set status to **Inactive** → no 500 error
- [ ] Archive (delete) an employee → no 500 error
- [ ] Filter employee list by **Inactive** → returns results, no 500
- [ ] Filter employee list by **Non-Teaching** → returns results, no 500
- [ ] Go to `/dashboard` → Non-Teaching bar shows actual count (not 0)
- [ ] Perform any CRUD action → go to `/audit-logs` → verify entry appears with correct `action_type`
- [ ] TypeScript compiler: run `npm run types:check` → no type errors on `PersonnelType`
