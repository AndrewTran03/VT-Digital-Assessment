import mongoose from "mongoose";
import config from "config";
import { CanvasCourseObjectiveGroup, seasonValues } from "../../assets/types";

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
      enum: seasonValues
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
