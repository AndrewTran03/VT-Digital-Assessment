import mongoose from "mongoose";
import config from "config";
import { CanvasUserAPIEntryBase } from "../../assets/types";

const mongoDBName = config.get<string>("mongoDatabaseName");
const canvasUserApiCollectionName = config.get<string>("canvasUserApiCollectionName");

const CanvasUserApiSchema = new mongoose.Schema<CanvasUserAPIEntryBase>(
  {
    canvasUsername: {
      type: String,
      required: true
    },
    canvasUserApiKey: {
      type: String,
      required: true
    },
    canvasUserId: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: {
      createdAt: "created_date",
      updatedAt: "updated_date"
    },
    collection: canvasUserApiCollectionName
  }
);

const CanvasUserApiModel = mongoose.model<CanvasUserAPIEntryBase>(`${mongoDBName}_CanvasUsers`, CanvasUserApiSchema);

export { CanvasUserApiModel, canvasUserApiCollectionName };
