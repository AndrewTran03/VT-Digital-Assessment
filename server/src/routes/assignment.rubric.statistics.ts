import express from "express";
import log from "../utils/logger";
import { CanvasCourseAssignmentRubricObjModel } from "../models/canvas.assignment.rubric.model";
import { CanvasAssignmentWithRubricStats } from "../canvas_stats/canvas.assignment.rubric.stats";
import { CanvasCourseAssignmentRubricObjBase } from "../shared/types";

const router = express.Router();

let index = 0;
router.get("/api/statistics/assignment_rubric/:canvasUserId", async (req, res) => {
  const canvasUserId = parseInt(req.params.canvasUserId);
  const assignmentRubricEntryArr = await CanvasCourseAssignmentRubricObjModel.find({ canvasUserId: canvasUserId });
  index++;
  log.info(`END OF ASSIGNMENT RUBRIC STATS GET REQUEST #${index} ---------------------`);
  return res.status(200).send(JSON.stringify(assignmentRubricEntryArr, null, 2));
});

router.post("/api/statistics/assignment_rubric", async (req, res) => {
  const currStatEntry = req.body as CanvasCourseAssignmentRubricObjBase;
  const stats = new CanvasAssignmentWithRubricStats(
    currStatEntry.rubricData,
    currStatEntry.recentSubmissionData,
    currStatEntry.canvasMatchedLearningObjectivesArr
  );
  const quizStatResults = stats.computeAssignmentWithRubricStats();
  log.warn(quizStatResults);
  log.info("STATUS: GOT HERE ASSIGNMENT WITH RUBRIC STAT -----------");
  return res.status(200).send(JSON.stringify(quizStatResults, null, 2));
});

export { router as assignmentRubricStatsRouter };
