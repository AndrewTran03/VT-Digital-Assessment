import express from "express";
import log from "../utils/logger";
import { APIErrorResponse } from "../../assets/types";
import { fetchCanvasUserCourseData, fetchCanvasUserQuizData, checkQuizMapHelper } from "../canvas_interact/canvas.api";
import { mapReplacer } from "../utils/json.helper";

const router = express.Router();

let index = 0;
router.get("/api/canvas/external_canvas_api", async (_, res) => {
  try {
    const canvasUserCourseIds = await fetchCanvasUserCourseData();
    const canvasQuizMap = await fetchCanvasUserQuizData(canvasUserCourseIds);
    // checkQuizMapHelper(canvasQuizMap);
    index++;
    log.info(`END OF GET REQUEST #${index} ------------------------`);
    return res.status(200).send(JSON.stringify(canvasQuizMap, mapReplacer, 2));
  } catch (err) {
    log.error("Error with interacting the Canvas API! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "Error with interacting the Canvas API"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as canvasDataRouter };
