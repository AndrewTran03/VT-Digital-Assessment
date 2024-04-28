// Shared Typescript Types/Interfaces/Other Global-Variables Used Throughout the Project:

// Reference: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
  [K in keyof T]: T[K];
} & unknown;

type numberLike = number | null;
type booleanLike = boolean | null;
type numberArrLike = number[] | null;

// Using built-in Vite properties to determine frontend & backend URLs for the application
const mode = import.meta.env.MODE;
let backendServerPort = -1;
console.log(`--------- ENVIORNMENT USED IN FRONTEND: ${mode} ---------`);
if (mode === "development") {
  backendServerPort = 3000;
} else if (mode === "production" || mode === "staging") {
  backendServerPort = 3001;
} else {
  console.error('Invalid configuration for the Vite "MODE" variable: ');
  console.error(mode);
  process.exit(1);
}

const hostNameLowercase = window.location.hostname.toLowerCase();
const firstDotIndex = hostNameLowercase.indexOf(".");
const backendUrlBase =
  hostNameLowercase !== "localhost" && firstDotIndex !== -1
    ? `https://${`${hostNameLowercase.slice(0, firstDotIndex)}-server${hostNameLowercase.slice(firstDotIndex)}`}`
    : `http://${hostNameLowercase}:${backendServerPort}`;
console.log(`Server URL: ${backendUrlBase}`);

type SystemColorThemes = "dark" | "light" | "high-contrast" | "other";

// Required with All MongoDB Entries:
type MongoDBId = {
  readonly _id: string; // Primary Key (IDentifier)
};

type MongoDBEntry = Prettify<
  MongoDBId & {
    readonly __v: number; // Version Number (Auto-Increments - Avoiding Duplicate Entry-Modification)
    readonly createdDate: string;
    readonly updatedDate: string;
  }
>;

type MongoDBCombined<T> = Prettify<MongoDBEntry & T>;

type MongoDBWithId<T> = Prettify<MongoDBId & T>;

type APIErrorResponse = {
  errorLoc: string;
  errorMsg: string;
};

enum Season {
  Fall = "Fall",
  Spring = "Spring",
  Summer = "Summer",
  Winter = "Winter"
}
type SeasonEnumValues = keyof typeof Season;
const seasonValues = ["Fall", "Spring", "Summer", "Winter"] as const;

type SingleCanvasLearningObjective = {
  deptAbbrev: string;
  courseNum: number;
  semester: SeasonEnumValues;
  year: number;
  canvasCourseInternalId: number;
  canvasObjective: string;
};

type MultipleCanvasLearningObjectivesBase = {
  deptAbbrev: string;
  courseNum: number;
  semester: SeasonEnumValues;
  year: number;
  canvasCourseInternalId: number;
  canvasObjectives: string[];
};

type CanvasLearningObjectives = MongoDBCombined<MultipleCanvasLearningObjectivesBase>;

type LearningObjectiveQuizData = {
  canvasCourseInternalId: number;
  quizId: number;
};

enum QuestionType {
  multiple_choice_question = "multiple_choice_question",
  essay_question = "essay_question",
  true_false_question = "true_false_question",
  multiple_dropdowns_question = "multiple_dropdowns_question",
  fill_in_multiple_blanks_question = "fill_in_multiple_blanks_question",
  multiple_answers_question = "multiple_answers_question",
  short_answer_question = "short_answer_question",
  numerical_question = "numerical_question"
}
type QuestionTypeEnumValues = keyof typeof QuestionType;

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

type CanvasQuizAnswer = CanvasCourseMCQAnswerMongoDBEntryBase;

type CanvasCourseQuizMongoDBEntryBase = {
  canvasUserId: number;
  canvasCourseInternalId: number;
  canvasCourseName: string;
  quizId: number;
  quizName: string;
  canvasMatchedLearningObjectivesArr: string[];
  canvasQuizEntries: CanvasCourseQuizQuestionMongoDBEntryBase[];
};

type CanvasCourseQuizQuestionMongoDBEntryBase = {
  questionType: QuestionTypeEnumValues;
  questionText: string;
  answers?: CanvasCourseMCQAnswerMongoDBEntryBase[];
};

type CanvasCourseMCQAnswerMongoDBEntryBase = {
  weight: number;
  migration_id: string;
  id: number;
  text: string;
};

type CanvasCourseQuizMongoDBEntry = MongoDBCombined<{
  canvasUserId: number;
  canvasCourseInternalId: number;
  canvasCourseName: string;
  canvasCourseDept: string;
  canvasCourseNum: number;
  quizId: number;
  quizName: string;
  canvasMatchedLearningObjectivesArr: string[][];
  canvasQuizEntries: CanvasCourseQuizQuestionMongoDBEntry[];
}>;

type CanvasCourseQuizQuestionMongoDBEntry = MongoDBWithId<{
  questionType: QuestionTypeEnumValues;
  questionText: string;
  answers?: CanvasCourseMCQAnswerMongoDBEntry[];
}>;

type CanvasCourseMCQAnswerMongoDBEntry = MongoDBWithId<{
  weight: number;
  migration_id: string;
  id: number;
  text: string;
}>;

const multipleChoiceQuestionLetters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
] as const;

type CanvasCourseAssociations = {
  deptAbbrev: string;
  courseNum: number;
  courseName: string;
};

type CanvasUserInfoObj = {
  canvasUserId: number;
};

type CanvasQuizStatistic = {
  id: number;
  url: string;
  html_url: string;
  multiple_attempts_exist: boolean;
  generated_at: string;
  includes_all_versions: boolean;
  includes_sis_ids: boolean;
  points_possible: number;
  anonymous_survey: boolean;
  speed_grader_url: string;
  quiz_submissions_zip_url: string;
  question_statistics: CanvasQuizQuestionStatistic[];
  submission_statistics: CanvasQuizSubmissionStatistics;
  links: {
    quiz: string;
  };
};

type CanvasQuizQuestionStatistic = {
  id: number;
  question_type: QuestionTypeEnumValues;
  question_text: string;
  position: number;
  responses: number;
  answers: CanvasQuizQuestionAnswerStatistic[];
  answerSets: CanvasQuizQuestionAnswerSetStatistic[];
  answered_student_count: numberLike;
  top_student_count: numberLike;
  middle_student_count: numberLike;
  bottom_student_count: numberLike;
  correct_student_count: numberLike;
  incorrect_student_count: numberLike;
  correct_student_ratio: numberLike;
  incorrect_student_ratio: numberLike;
  correct_top_student_count: numberLike;
  correct_middle_student_count: numberLike;
  correct_bottom_student_count: numberLike;
  variance: numberLike;
  stdev: numberLike;
  difficulty_index: numberLike;
  alpha: numberLike;
  point_biserials: CanvasQuizQuestionPointBiserial[];
  // For "numerical_question" type questions
  full_credit: numberLike;
  incorrect: numberLike;
  // For "numerical_question, short_answer, and multiple_dropdowns" type questions
  correct: numberLike;
  // For "multiple_dropdowns" type questions
  partially_correct: numberLike;
};

type CanvasQuizQuestionAnswerStatistic = {
  id: string;
  text: string;
  correct: boolean;
  responses: number;
  user_ids: number[];
  user_names: string[];
  // For "numerical_question" type questions
  margin: numberLike;
  isRange: booleanLike;
  // For (some) "numerical_question" type questions
  value: numberArrLike;
};

type CanvasQuizQuestionAnswerSetStatistic = {
  id: string;
  text: string;
  answers: CanvasQuizQuestionAnswerStatistic[];
};

type CanvasQuizSubmissionStatistics = {
  scores: Record<string, number>;
  score_average: numberLike;
  score_high: numberLike;
  score_low: numberLike;
  score_stdev: numberLike;
  correct_count_average: numberLike;
  incorrect_count_average: numberLike;
  duration_average: numberLike;
  unique_count: numberLike;
};

type CanvasQuizQuestionPointBiserial = {
  answer_id: number;
  point_biserial: numberLike;
  correct: boolean;
  distractor: boolean;
};

type CanvasQuizStatisticsResultObj = {
  quizAveragePointsEarned: numberLike;
  quizMedianPointsEarned: numberLike;
  quizPercentageCategories: number[];
  perQuestionItemDifficulty: numberLike[];
  perQuestionAveragePointsEarned: numberLike[];
  perQuestionAnswerFrequencies: CanvasQuizQuestionAnswerFrequencyStatistic[];
  perLearningObjPercentageCategories: Array<[string, number[]]>;
};

type CanvasQuizQuestionAnswerFrequencyStatistic = {
  question_type: QuestionTypeEnumValues;
  question_text: string;
  answer_frequencies: CanvasQuizQuestionAnswerFrequencyArrEntry[];
  answer_set_frequencies: CanvasQuizQuestionAnswerSetFrequencyArrEntry[];
};

type CanvasQuizQuestionAnswerFrequencyArrEntry = {
  answer_text: string;
  frequency_count: number;
};

type CanvasQuizQuestionAnswerSetFrequencyArrEntry = {
  answer_set_text: string;
  answer_frequencies: CanvasQuizQuestionAnswerFrequencyArrEntry[];
};

type CanvasCourseAssignmentRubricObjBaseProperties = {
  canvasAssignmentId: number;
  canvasAssignmentName: string;
  canvasRubricId: number;
  title: string;
  maxPoints: number;
  rubricData: AssignmentRubricCriteriaMongoDBEntry[];
};

type AssignmentRubricCriteriaMongoDBEntry = {
  id: string;
  maxCategoryPoints: number;
  description: string;
  ratings: AssignmentRubricRatingMongoDBEntry[];
};

type AssignmentRubricRatingMongoDBEntry = {
  description: string;
  ratingPoints: number;
};

type CanvasCourseAssignmentRubricObjExtraProperties = {
  canvasUserId: number;
  canvasDeptAbbrev: string;
  canvasCourseNum: number;
  canvasCourseName: string;
  canvasCourseInternalId: number;
  canvasMatchedLearningObjectivesArr: string[][];
  recentSubmissionData: CanvasCourseAssignmentRubricSubmissionMongoDBEntry[];
};

type CanvasCourseAssignmentRubricSubmissionMongoDBEntry = {
  canvasAssignmentScore: number;
  rubricCategoryScores: CanvasCourseAssignmentRubricCategorySubmissionScore[];
};

type CanvasCourseAssignmentRubricCategorySubmissionScore = {
  id: string;
  points: number;
};

type CanvasCourseAssignmentRubricObjBase = Prettify<
  CanvasCourseAssignmentRubricObjBaseProperties & CanvasCourseAssignmentRubricObjExtraProperties
>;

type CanvasCourseAssignmentRubricObjMongoDBEntry = MongoDBCombined<CanvasCourseAssignmentRubricObjBase>;

type LearningObjectiveAssignmentWithRubricData = {
  canvasCourseInternalId: number;
  rubricId: number;
};

type CanvasAssignmentWithRubricStatisticsResultObj = {
  assignmentAveragePointsEarned: number;
  assignmentMedianPointsEarned: number;
  assignmentPercentageCategories: number[];
  perLearningObjPercentageCategories: Array<[string, number[]]>;
  perRubricCritieriaAveragePointsEarned: number[];
  perRubricCritieriaMedianPointsEarned: number[];
  perRubricCriteriaAnswerFrequencies: CanvasCourseAssignmentRubricCategoryAnswerStatistic[];
};

type CanvasCourseAssignmentRubricCategoryAnswerStatistic = {
  id: string;
  description: string;
  pointsArr: number[];
  ratingsSubArr: RubricRatingSubmissionScore[];
};

type RubricRatingSubmissionScore = Prettify<
  AssignmentRubricRatingMongoDBEntry & {
    ratingCount: number;
  }
>;

const PERCENTAGE_CATEGORIES = ["Exceeds", "Meets", "Below", "None"] as const;

export {
  backendUrlBase,
  SystemColorThemes,
  seasonValues,
  MongoDBWithId,
  MongoDBCombined,
  SeasonEnumValues,
  QuestionTypeEnumValues,
  APIErrorResponse,
  SingleCanvasLearningObjective,
  MultipleCanvasLearningObjectivesBase,
  CanvasLearningObjectives,
  CanvasQuizQuestion,
  CanvasCourseQuizMongoDBEntryBase,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasCourseMCQAnswerMongoDBEntry,
  LearningObjectiveQuizData,
  multipleChoiceQuestionLetters,
  CanvasCourseAssociations,
  CanvasUserInfoObj,
  CanvasQuizStatistic,
  CanvasQuizStatisticsResultObj,
  CanvasQuizQuestionAnswerFrequencyArrEntry,
  CanvasQuizQuestionAnswerSetFrequencyArrEntry,
  CanvasCourseAssignmentRubricObjMongoDBEntry,
  LearningObjectiveAssignmentWithRubricData,
  CanvasAssignmentWithRubricStatisticsResultObj,
  CanvasCourseAssignmentRubricCategoryAnswerStatistic,
  RubricRatingSubmissionScore,
  PERCENTAGE_CATEGORIES
};
