// Shared Typescript Types/Interfaces/Other Global-Variables Used Throughout the Project:

// Reference: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type APIErrorResponse = {
  errorLoc: string;
  errorMsg: string;
};

// Reference: https://canvas.vt.edu/doc/api/live#!/assignments.json/
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
  grading_periods?: object[]; // GradingPeriod type not strictly defined
  grading_standard_id?: number;
  grade_passback_setting?: string;
  created_at?: Date;
  start_at?: Date;
  end_at?: Date;
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
  blueprint_restrictions?: object; // BlueprintRestrictions type not strictly defined
  blueprint_restrictions_by_object_type?: object;
  template?: boolean;
};

type Calendar = {
  ics: string;
};

type Term = {
  id?: number;
  name?: string;
  start_at?: Date;
  end_at?: Date;
};

type CourseProgress = {
  requirement_count?: number;
  requirement_completed_count?: number;
  next_requirement_url?: string;
  completed_at?: Date;
};

type Enrollment = {
  type: string;
  role: string;
  role_id: number;
  user_id: number;
  enrollment_state: string;
  limit_privileges_to_course_section: boolean;
};

type CanvasQuiz = {
  id?: number;
  title?: string;
  html_url?: string;
  mobile_url?: string;
  preview_url?: string;
  description?: string;
  quiz_type?: "practice_quiz" | "assignment" | "graded_survey" | "survey";
  assignment_group_id?: number;
  time_limit?: number;
  shuffle_answers?: boolean;
  hide_results?: "always" | "until_after_last_attempt" | null;
  show_correct_answers?: boolean;
  show_correct_answers_last_attempt?: boolean;
  show_correct_answers_at?: Date;
  hide_correct_answers_at?: Date;
  one_time_results?: boolean;
  scoring_policy?: "keep_highest" | "keep_latest";
  allowed_attempts?: number;
  one_question_at_a_time?: boolean;
  question_count?: number;
  points_possible?: number;
  cant_go_back?: boolean;
  access_code?: string;
  ip_filter?: string;
  due_at?: Date;
  lock_at?: Date;
  unlock_at?: Date;
  published?: boolean;
  unpublishable?: boolean;
  locked_for_user?: boolean;
  lock_info?: LockInfo;
  lock_explanation?: string;
  speedgrader_url?: string;
  quiz_extensions_url?: string;
  permissions?: QuizPermissions;
  all_dates?: AssignmentDate[];
  version_number?: number;
  question_types?: string[];
  anonymous_submissions?: boolean;
};

type LockInfo = {
  unlock_at?: Date;
  missing_permission?: string;
  asset_string: string;
};

type AssignmentDate = {
  due_at: Date;
  unlock_at: Date;
  lock_at: Date;
  base: boolean;
};

type QuizPermissions = {
  read?: boolean;
  submit?: boolean;
  create?: boolean;
  manage?: boolean;
  read_statistics?: boolean;
  review_grades?: boolean;
  update?: boolean;
};

type CanvasQuizQuestion = {
  id: number;
  quiz_id: number;
  position?: number;
  question_name?: string;
  question_type?: QuestionTypeEnumValues;
  question_text?: string;
  points_possible?: number;
  correct_comments?: string;
  incorrect_comments?: string;
  neutral_comments?: string;
  answers?: CanvasQuizAnswer[];
};

type CanvasQuizAnswer = CanvasCourseMCQAnswerMongoDBEntry;

// type CanvasQuizAnswer = {
//   id?: number;
//   answer_text: string;
//   answer_weight: number;
//   answer_comments?: string;
//   text_after_answers?: string;
//   answer_match_left?: string;
//   answer_match_right?: string;
//   matching_answer_incorrect_matches?: string;
//   numerical_answer_type?: "exact_answer" | "range_answer" | "precision_answer";
//   exact?: number;
//   margin?: number;
//   approximate?: number;
//   precision?: number;
//   start?: number;
//   end?: number;
//   blank_id?: number;
// };

type CanvasQuizQuestionGroup = {
  quizId: number;
  questions: CanvasQuizQuestion[];
};

type CourseObjectiveBase = {
  deptAbbrev: string;
  courseNum: number;
  semester: "Fall" | "Spring" | "Summer" | "Winter";
  year: number;
  canvasCourseInternalId: number;
};

type CanvasCourseSingleCourseObjective = Prettify<
  CourseObjectiveBase & {
    canvasObjective: string;
  }
>;

type CanvasCourseObjectiveGroup = Prettify<
  CourseObjectiveBase & {
    canvasObjectives: string[];
  }
>;

const SeasonValues = ["Fall", "Spring", "Summer", "Winter"] as const;
enum QuestionType {
  multiple_choice_question = "multiple_choice_question",
  essay_question = "essay_question",
  multiple_dropdown_question = "multiple_dropdown_question",
  fill_in_multiple_blanks_question = "fill_in_multiple_blanks_question",
  multiple_answers_question = "multiple_answers_question",
  short_answer_question = "short_answer_question",
  numerical_question = "numerical_question"
}
type QuestionTypeEnumValues = keyof typeof QuestionType;

type CanvasCourseQuizMongoDBEntry = {
  canvasUserId: number;
  canvasCourseInternalId: number;
  quizId: number;
  canvasMatchedLearningObjectivesArr: string[];
  canvasQuizEntries: CanvasCourseQuizQuestionMongoDBEntry[];
};

type CanvasCourseQuizQuestionMongoDBEntry = {
  questionType: QuestionTypeEnumValues;
  questionText: string;
  answers?: CanvasCourseMCQAnswerMongoDBEntry[];
};

type CanvasCourseMCQAnswerMongoDBEntry = {
  weight: number;
  migration_id: string;
  id: number;
  text: string;
};

const QuestionTypeValues = [
  "multiple_choice_question",
  "essay_question",
  "true_false_question",
  "multiple_dropdowns_question",
  "fill_in_multiple_blanks_question",
  "multiple_answers_question",
  "short_answer_question",
  "numerical_question"
] as const;

export {
  APIErrorResponse,
  CanvasCourse,
  CanvasQuiz,
  CanvasQuizQuestion,
  CanvasQuizQuestionGroup,
  CanvasCourseSingleCourseObjective,
  CanvasCourseObjectiveGroup,
  SeasonValues,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasCourseMCQAnswerMongoDBEntry,
  QuestionTypeEnumValues,
  QuestionTypeValues
};
