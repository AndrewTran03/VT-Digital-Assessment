// Shared Typescript Types/Interfaces/Other Global-Variables Used Throughout the Project:

// Reference: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

const backendUrlBase = "http://localhost:3000";

// REMOVE THESE LATER
type Test1 = {
  name: string;
  num: number;
};

type Test2 = Prettify<
  Test1 & {
    isTrue: boolean;
  }
>;

// Required with All MongoDB Entries:
type MongoDBEntry = {
  readonly _id: string; // Primary Key (IDentifier)
  readonly __v: number; // Version Number (Auto-Increments - Avoiding Duplicate Entry-Modification)
  readonly createdDate: string;
  readonly updatedDate: string;
};

type MongoDBCombined<T> = Prettify<MongoDBEntry & T>;

type APIErrorResponse = {
  errorLoc: string;
  errorMsg: string;
};

type CourseObjectiveBase = {
  deptAbbrev: string;
  courseNum: number;
  semester: "Fall" | "Spring" | "Summer" | "Winter";
  year: number;
  canvasCourseInternalCode: number;
  canvasObjective: string;
};

type CourseObjective = MongoDBCombined<CourseObjectiveBase>;

type CanvasQuizQuestion = {
  id: number;
  quiz_id: number;
  position?: number;
  question_name?: string;
  question_type?: string;
  question_text?: string;
  points_possible?: number;
  correct_comments?: string;
  incorrect_comments?: string;
  neutral_comments?: string;
  answers?: CanvasQuizAnswer[];
};

type CanvasQuizAnswer = {
  id?: number;
  answer_text: string;
  answer_weight: number;
  answer_comments?: string;
  text_after_answers?: string;
  answer_match_left?: string;
  answer_match_right?: string;
  matching_answer_incorrect_matches?: string;
  numerical_answer_type?: "exact_answer" | "range_answer" | "precision_answer";
  exact?: number;
  margin?: number;
  approximate?: number;
  precision?: number;
  start?: number;
  end?: number;
  blank_id?: number;
};

type CanvasQuizQuestionGroup = {
  quizId: number;
  questions: CanvasQuizQuestion[];
};

type CanvasQuizMap = Map<number, CanvasQuizQuestionGroup[]>;

export {
  Test2,
  backendUrlBase,
  APIErrorResponse,
  CourseObjectiveBase,
  CourseObjective,
  CanvasQuizQuestion,
  CanvasQuizQuestionGroup,
  CanvasQuizMap
};
