// Shared Typescript Types/Interfaces/Other Global-Variables Used Throughout the Project:

// Reference: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

type Calendar = {
    ics: string;
};

type Term = {
    id?: number;
    name?: string;
    start_at?: string;
    end_at?: string;
};

type CourseProgress = {
    requirement_count?: number;
    requirement_completed_count?: number;
    next_requirement_url?: string;
    completed_at?: string;
};

type Enrollment = {
    type: string;
    role: string;
    role_id: number;
    user_id: number;
    enrollment_state: string;
    limit_privileges_to_course_section: boolean;
};

type CanvasCourse = {
    id?: number;
    sis_course_id?: string;
    uuid?: string;
    integration_id?: string;
    sis_import_id?: number;
    name?: string;
    course_code?: string;
    original_name?: string;
    workflow_state?: "unpublished" | "available" | "completed" | "deleted";
    account_id?: number;
    root_account_id?: number;
    enrollment_term_id?: number;
    grading_periods?: object[]; // GradingPeriod type not defined
    grading_standard_id?: number;
    grade_passback_setting?: string;
    created_at?: string;
    start_at?: string;
    end_at?: string;
    locale?: string;
    enrollments?: Enrollment[];
    total_students?: number;
    calendar?: Calendar;
    default_view?: "feed" | "wiki" | "modules" | "syllabus" | "assignments";
    syllabus_body?: string;
    needs_grading_count?: number;
    term?: Term;
    course_progress?: CourseProgress;
    apply_assignment_group_weights?: boolean;
    permissions?: object;
    is_public?: boolean;
    is_public_to_auth_users?: boolean;
    public_syllabus?: boolean;
    public_syllabus_to_auth?: boolean;
    public_description?: string;
    storage_quota_mb?: number;
    storage_quota_used_mb?: number;
    hide_final_grades?: boolean;
    license?: string;
    allow_student_assignment_edits?: boolean;
    allow_wiki_comments?: boolean;
    allow_student_forum_attachments?: boolean;
    open_enrollment?: boolean;
    self_enrollment?: boolean;
    restrict_enrollments_to_course_dates?: boolean;
    course_format?: string;
    access_restricted_by_date?: boolean;
    time_zone?: string;
    blueprint?: boolean;
    blueprint_restrictions?: object; // BlueprintRestrictions type not defined
    blueprint_restrictions_by_object_type?: object;
    template?: boolean;
};

export { CanvasCourse };
