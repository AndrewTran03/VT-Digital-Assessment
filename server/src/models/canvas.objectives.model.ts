import mongoose from "mongoose";
import config from "config";
import { CanvasCourseObjectiveGroup, seasonValuesArr } from "../shared/types";

const mongoDBName = config.get<string>("mongoDatabaseName");
const canvasObjectivesMongoCollectionName = config.get<string>("canvasObjectivesMongoCollectionName");

const CanvasObjectivesSchema = new mongoose.Schema<CanvasCourseObjectiveGroup>(
  {
    deptAbbrev: {
      type: String,
      required: true
    },
    courseNum: {
      type: Number,
      required: true
    },
    semester: {
      type: String,
      required: true,
      enum: seasonValuesArr
    },
    year: {
      type: Number,
      required: true
    },
    canvasCourseInternalId: {
      type: Number,
      required: true
    },
    canvasObjectives: {
      type: [String],
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
    collection: canvasObjectivesMongoCollectionName
  }
);

const CourseObjectivesModel = mongoose.model<CanvasCourseObjectiveGroup>(
  `${mongoDBName}_CourseObjectives`,
  CanvasObjectivesSchema
);

export { CourseObjectivesModel, canvasObjectivesMongoCollectionName };
