import mongoose from "mongoose";
import config from "config";
import {
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasCourseMCQAnswerMongoDBEntry
} from "../../assets/types";

const mongoDBName = config.get<string>("mongoDatabaseName");
const canvasQuizzesMongoCollectionName = config.get<string>("canvasQuizzesMongoCollectionName");

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

const CanvasCourseMCQAnswerModel = mongoose.model<CanvasCourseMCQAnswerMongoDBEntry>(
  `${mongoDBName}_CanvasCourseMCQAnswer`,
  CanvasCourseMCQAnswerSchema
);

const CanvasCourseQuizQuestionSchema = new mongoose.Schema<CanvasCourseQuizQuestionMongoDBEntry>({
  questionType: {
    type: String,
    required: true,
    enum: [
      "multiple_choice_question",
      "essay_question",
      "true_false_question",
      "multiple_dropdowns_question",
      "fill_in_multiple_blanks_question",
      "multiple_answers_question",
      "short_answer_question",
      "numerical_question"
    ] as const
  },
  questionText: {
    type: String,
    required: true
  },
  answers: {
    type: [CanvasCourseMCQAnswerModel.schema],
    required: false,
    default: []
  }
});

const CanvasCourseQuizQuestionModel = mongoose.model<CanvasCourseQuizQuestionMongoDBEntry>(
  `${mongoDBName}_CanvasCourseQuizQuestion`,
  CanvasCourseQuizQuestionSchema
);

const CanvasCourseQuizSchema = new mongoose.Schema<CanvasCourseQuizMongoDBEntry>(
  {
    courseId: {
      type: Number,
      required: true
    },
    quizId: {
      type: Number,
      required: true
    },
    canvasQuizEntries: {
      type: [CanvasCourseQuizQuestionModel.schema],
      required: true
    }
  },
  {
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
