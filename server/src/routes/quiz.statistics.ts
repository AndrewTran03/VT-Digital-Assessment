import express from "express";
import log from "../utils/logger";
import { APIErrorResponse, CanvasQuizStatistic, CanvasQuizStatisticsResultObj } from "../shared/types";
import { fetchCanvasUserCourseData } from "../canvas_interact/canvas.api.course";
import { fetchCanvasUserQuizReportData } from "../canvas_interact/canvas.api.quiz.stats";
import { getCanvasApiAuthHeaders } from "../utils/canvas.connection";
import { CanvasQuizStats } from "../canvas_stats/canvas.quiz.stats";
import { CanvasCourseQuizModel } from "../models/canvas.quiz.model";

const router = express.Router();

let index = 0;
router.get("/api/statistics/quiz/:canvasUserId", async (req, res) => {
  const canvasUserId = parseInt(req.params.canvasUserId);
  const axiosHeaders = await getCanvasApiAuthHeaders(canvasUserId);
  const canvasUserCourseIds = await fetchCanvasUserCourseData(axiosHeaders);
  const canvasQuizStatisticArr = await fetchCanvasUserQuizReportData(axiosHeaders, canvasUserId, canvasUserCourseIds);
  index++;
  log.info(`END OF QUIZ STATS GET REQUEST #${index} ---------------------`);
  return res.status(200).send(JSON.stringify(canvasQuizStatisticArr, null, 2));
});

router.post("/api/statistics/quiz/:canvasUserId/:canvasCourseInternalId/:canvasQuizId", async (req, res) => {
  const canvasUserId = parseInt(req.params.canvasUserId);
  const canvasCourseInternalId = parseInt(req.params.canvasCourseInternalId);
  const canvasQuizId = parseInt(req.params.canvasQuizId);
  const currStatEntry = req.body as CanvasQuizStatistic;
  try {
    const currLearningObjMatchingsToFind = await CanvasCourseQuizModel.findOne({
      canvasUserId: canvasUserId,
      canvasCourseInternalId: canvasCourseInternalId,
      quizId: canvasQuizId
    });
    if (!currLearningObjMatchingsToFind) {
      throw new Error("The specified Canvas course learning objective matches do not exist in the MongoDB database");
    }
    const learningObjectiveArr = currLearningObjMatchingsToFind.canvasMatchedLearningObjectivesArr;
    const stats = new CanvasQuizStats(currStatEntry, learningObjectiveArr);
    const quizStatResults = stats.computeQuizStats();
    log.warn(quizStatResults);
    log.info("STATUS: GOT HERE QUIZ STAT -----------");
    return res.status(200).send(JSON.stringify(quizStatResults, null, 2));
  } catch (err) {
    log.error("Error with interacting with the MongoDB database! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "POST",
      errorMsg: "No items found in MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as quizStatsRouter };