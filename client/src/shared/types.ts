// Shared Typescript Types/Interfaces/Other Global-Variables Used Throughout the Project:

// Reference: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

const backendUrlBase = "http://localhost:3000";

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
  quizId: number;
  quizName: string;
  canvasMatchedLearningObjectivesArr: string[];
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

export {
  backendUrlBase,
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
  multipleChoiceQuestionLetters
};
