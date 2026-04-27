// Domain entity types for the CCFP Engagement Framework
// These mirror the Supabase Postgres schema (database.md)

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'ccfp_admin' | 'college_rep' | 'org_rep';

export type PersonnelType = 'teaching' | 'non_teaching';

export type EmployeeStatus = 'active' | 'inactive';

export type EventScope = 'university' | 'college' | 'organization';

export type ParticipationRole = 'participant' | 'organizer' | 'donor';

export type Semester = '1st' | '2nd' | 'summer';

// ─── Models ──────────────────────────────────────────────────────────────────

export type Profile = {
    user_id: string;
    user_name: string;
    user_email: string;
    role: UserRole;
    unit_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    // joined from organizational_units (optional)
    unit?: OrganizationalUnit;
};

export type OrganizationalUnit = {
    unit_id: string;
    unit_name: string;
    unit_type: 'college' | 'organization';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    is_archived: boolean;
};

export type Employee = {
    employee_id: string;
    employee_number: number;
    employee_name: string;
    personnel_type: PersonnelType;
    status: EmployeeStatus;
    unit_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    is_archived: boolean;
    unit?: OrganizationalUnit;
};

export type AcademicTerm = {
    term_id: string; // date PK
    academic_year: string;
    semester: Semester;
    start_date: string;
    end_date: string;
    is_current: boolean;
    created_at: string;
};

export type Event = {
    event_id: string;
    title: string;
    description: string | null;
    scope: EventScope;
    activity_program: string | null;
    term_id: string;
    unit_id: string;
    event_date: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    is_archived: boolean;
    term?: AcademicTerm;
    unit?: OrganizationalUnit;
};

export type AttendanceRecord = {
    attendance_id: string;
    employee_id: string;
    event_id: string;
    participation_role: ParticipationRole;
    points_awarded: number;
    recorded_by: string;
    recorded_at: string;
    is_manual_override: boolean;
    override_reason: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    is_archived: boolean;
    employee?: Employee;
};

export type PointPolicy = {
    policy_id: string;
    participation_role: ParticipationRole;
    default_points: number;
    created_at: string;
};

export type ActivityLog = {
    log_id: string;
    user_id: string;
    action_type: string;
    target_id: string | null;
    description: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    user?: Profile;
};

// ─── Pagination wrapper (Laravel Paginator shape) ────────────────────────────

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};
