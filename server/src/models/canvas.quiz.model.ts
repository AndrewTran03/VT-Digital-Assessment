import mongoose from "mongoose";
import config from "config";
import {
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasCourseMCQAnswerMongoDBEntry,
  QuestionTypeValues,
  seasonValuesArr,
  SeasonTypeEnumValues
} from "../shared/types";

const mongoDBName = config.get<string>("mongoDatabaseName");
const canvasQuizzesMongoCollectionName = config.get<string>("canvasQuizzesMongoCollectionName");

// Reference: https://mongoosejs.com/docs/api/schemastring.html
// Allow empty strings to pass "required" check (needed for initial empty string of "canvasMatchedLearningObjective" property)
mongoose.Schema.Types.String.checkRequired((v) => v !== null && v !== undefined);
// Allow null values to pass "required" check (needed for initial null value of "quizDueAt" property)
mongoose.Schema.Types.Date.checkRequired((v) => v !== undefined);

const CanvasCourseMCQAnswerSchema = new mongoose.Schema<CanvasCourseMCQAnswerMongoDBEntry>({
  weight: {
    type: Number,
    required: false
  },
  migration_id: {
    type: String,
    required: false
  },
  id: {
    type: Number,
    required: false
  },
  text: {
    type: String,
    required: false
  }
});

const CanvasCourseQuizQuestionSchema = new mongoose.Schema<CanvasCourseQuizQuestionMongoDBEntry>({
  questionType: {
    type: String,
    required: true,
    enum: QuestionTypeValues
  },
  questionText: {
    type: String,
    required: true
  },
  answers: {
    type: [CanvasCourseMCQAnswerSchema],
    default: [],
    required: true
  }
});

const CanvasCourseQuizSchema = new mongoose.Schema<CanvasCourseQuizMongoDBEntry>(
  {
    canvasUserId: {
      type: Number,
      required: true
    },
    canvasCourseInternalId: {
      type: Number,
      required: true
    },
    canvasCourseName: {
      type: String,
      required: true
    },
    canvasCourseDept: {
      type: String,
      required: true
    },
    canvasCourseNum: {
      type: Number,
      required: true
    },
    canvasCourseAcademicSemesterOffered: {
      type: String,
      required: true,
      enum: seasonValuesArr
    },
    canvasCourseAcademicYearOffered: {
      type: Number,
      required: true
    },
    quizId: {
      type: Number,
      required: true
    },
    quizName: {
      type: String,
      required: true
    },
    quizDueAt: {
      type: Date,
      required: true
    },
    canvasMatchedLearningObjectivesArr: {
      type: [[String]],
      required: true
    },
    canvasQuizEntries: {
      type: [CanvasCourseQuizQuestionSchema],
      required: true
    }
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: {
      createdAt: "created_date",
      updatedAt: "updated_date"
    },
    collection: canvasQuizzesMongoCollectionName
  }
);

const CanvasCourseQuizModel = mongoose.model<CanvasCourseQuizMongoDBEntry>(
  `${mongoDBName}_CanvasCourseQuiz`,
  CanvasCourseQuizSchema
);

export { CanvasCourseQuizModel, canvasQuizzesMongoCollectionName };
