import mongoose from "mongoose";
import config from "config";
import {
  CanvasCourseAssignmentRubricObjBase,
  AssignmentRubricCriteriaMongoDBEntry,
  AssignmentRubricRatingMongoDBEntry,
  CanvasCourseAssignmentRubricSubmissionMongoDBEntry,
  CanvasCourseAssignmentRubricCategorySubmissionScore,
  seasonValuesArr
} from "../shared/types";

const mongoDBName = config.get<string>("mongoDatabaseName");
const canvasAssignmentWithRubricMongoCollectionName = config.get<string>(
  "canvasAssignmentWithRubricMongoCollectionName"
);

// Reference: https://mongoosejs.com/docs/api/schemastring.html
// Allow empty strings to pass "required" check (needed for initial empty string of "canvasMatchedLearningObjective" property)
mongoose.Schema.Types.String.checkRequired((v) => v !== null && v !== undefined);
// Allow null values to pass "required" check (needed for initial null value of "quizDueAt" property)
mongoose.Schema.Types.Date.checkRequired((v) => v !== undefined);

const CanvasCourseAssignmentRubricCategorySubmissionScoreSchema =
  new mongoose.Schema<CanvasCourseAssignmentRubricCategorySubmissionScore>({
    id: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      required: true
    }
  });

const CanvasCourseAssignmentRubricSubmissionSchema =
  new mongoose.Schema<CanvasCourseAssignmentRubricSubmissionMongoDBEntry>({
    canvasAssignmentScore: {
      type: Number,
      required: true
    },
    rubricCategoryScores: {
      type: [CanvasCourseAssignmentRubricCategorySubmissionScoreSchema],
      required: true
    }
  });

const AssignmentRubricRatingSchema = new mongoose.Schema<AssignmentRubricRatingMongoDBEntry>({
  description: {
    type: String,
    required: true
  },
  ratingPoints: {
    type: Number,
    required: true
  }
});

const AssignmentRubricCriteriaSchema = new mongoose.Schema<AssignmentRubricCriteriaMongoDBEntry>({
  id: {
    type: String,
    required: true
  },
  maxCategoryPoints: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  ratings: {
    type: [AssignmentRubricRatingSchema],
    required: true
  }
});

const CanvasCourseAssignmentRubricObjSchema = new mongoose.Schema<CanvasCourseAssignmentRubricObjBase>(
  {
    canvasUserId: {
      type: Number,
      required: true
    },
    canvasDeptAbbrev: {
      type: String,
      required: true
    },
    canvasCourseNum: {
      type: Number,
      required: true
    },
    canvasCourseName: {
      type: String,
      required: true
    },
    canvasCourseInternalId: {
      type: Number,
      required: true
    },
    canvasAssignmentDueAt: {
      type: Date,
      required: true
    },
    canvasRubricId: {
      type: Number,
      required: true
    },
    canvasAssignmentId: {
      type: Number,
      required: true
    },
    canvasAssignmentName: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    maxPoints: {
      type: Number,
      required: true
    },
    rubricData: {
      type: [AssignmentRubricCriteriaSchema],
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
    canvasMatchedLearningObjectivesArr: {
      type: [[String]],
      required: true
    },
    recentSubmissionData: {
      type: [CanvasCourseAssignmentRubricSubmissionSchema],
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
    collection: canvasAssignmentWithRubricMongoCollectionName
  }
);

const CanvasCourseAssignmentRubricObjModel = mongoose.model<CanvasCourseAssignmentRubricObjBase>(
  `${mongoDBName}_CanvasCourseAssignmentRubric`,
  CanvasCourseAssignmentRubricObjSchema
);

export { CanvasCourseAssignmentRubricObjModel, canvasAssignmentWithRubricMongoCollectionName };
