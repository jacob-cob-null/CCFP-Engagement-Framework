-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.academic_terms (
  term_id date NOT NULL,
  academic_year text NOT NULL,
  semester text NOT NULL CHECK (semester = ANY (ARRAY['1st'::text, '2nd'::text, 'summer'::text])),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT academic_terms_pkey PRIMARY KEY (term_id)
);
CREATE TABLE public.activity_logs (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type USER-DEFINED NOT NULL,
  target_id uuid,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (log_id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.attendance (
  attendance_id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  event_id uuid NOT NULL,
  participation_role USER-DEFINED NOT NULL DEFAULT 'participant'::participation_role,
  points_awarded integer NOT NULL CHECK (points_awarded >= 0),
  recorded_by uuid NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  is_manual_override boolean NOT NULL DEFAULT false,
  override_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  is_archived boolean NOT NULL DEFAULT false,
  CONSTRAINT attendance_pkey PRIMARY KEY (attendance_id),
  CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
  CONSTRAINT attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id),
  CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.employee_point_totals (
  employee_id uuid NOT NULL,
  term_id date NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  last_calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT employee_point_totals_pkey PRIMARY KEY (employee_id, term_id),
  CONSTRAINT employee_point_totals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
  CONSTRAINT employee_point_totals_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.academic_terms(term_id)
);
CREATE TABLE public.employees (
  employee_id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_number bigint NOT NULL UNIQUE,
  employee_name text NOT NULL,
  personnel_type USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'active'::employee_status,
  unit_id character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  is_archived boolean NOT NULL DEFAULT false,
  CONSTRAINT employees_pkey PRIMARY KEY (employee_id),
  CONSTRAINT employees_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.organizational_units(unit_id)
);
CREATE TABLE public.event_point_overrides (
  override_id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  participation_role USER-DEFINED NOT NULL,
  points_awarded integer NOT NULL CHECK (points_awarded >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT event_point_overrides_pkey PRIMARY KEY (override_id),
  CONSTRAINT event_point_overrides_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id)
);
CREATE TABLE public.events (
  event_id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  scope USER-DEFINED NOT NULL,
  activity_program text,
  term_id date NOT NULL,
  unit_id character varying NOT NULL,
  event_date date NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  is_archived boolean NOT NULL DEFAULT false,
  CONSTRAINT events_pkey PRIMARY KEY (event_id),
  CONSTRAINT events_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.academic_terms(term_id),
  CONSTRAINT events_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.organizational_units(unit_id),
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.organizational_units (
  unit_id character varying NOT NULL,
  unit_name text NOT NULL,
  unit_type character varying NOT NULL CHECK (unit_type::text = ANY (ARRAY['college'::character varying, 'organization'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  is_archived boolean NOT NULL DEFAULT false,
  CONSTRAINT organizational_units_pkey PRIMARY KEY (unit_id)
);
CREATE TABLE public.point_policies (
  policy_id uuid NOT NULL DEFAULT gen_random_uuid(),
  participation_role USER-DEFINED NOT NULL UNIQUE,
  default_points integer NOT NULL CHECK (default_points >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT point_policies_pkey PRIMARY KEY (policy_id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL,
  unit_id character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT unit_required_for_reps CHECK (role = 'ccfp_admin' OR (role IN ('college_rep', 'sub_head', 'org_rep') AND unit_id IS NOT NULL)),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT profiles_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.organizational_units(unit_id)
);