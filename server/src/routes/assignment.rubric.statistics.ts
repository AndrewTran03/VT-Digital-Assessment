import express from "express";
import log from "../utils/logger";
import { CanvasCourseAssignmentRubricObjModel } from "../models/canvas.assignment.rubric.model";
import { CanvasAssignmentWithRubricStats } from "../canvas_stats/canvas.assignment.rubric.stats";
import { APIErrorResponse, CanvasCourseAssignmentRubricObjBase, SeasonTypeEnumValues } from "../shared/types";
import { CourseObjectivesModel } from "../models/canvas.objectives.model";

const router = express.Router();

let index = 0;
router.get("/api/statistics/assignment_rubric/:canvasUserId", async (req, res) => {
  const canvasUserId = parseInt(req.params.canvasUserId);
  const assignmentRubricEntryArr = await CanvasCourseAssignmentRubricObjModel.find({ canvasUserId: canvasUserId });
  index++;
  log.info(`END OF ASSIGNMENT RUBRIC STATS GET REQUEST #${index} ---------------------`);
  return res.status(200).send(JSON.stringify(assignmentRubricEntryArr, null, 2));
});

let indexSpecific = 0;
router.get(
  "/api/statistics/assignment_rubric/:canvasUserId/:academicSemesterStr/:academicYearStr",
  async (req, res) => {
    const canvasUserId = parseInt(req.params.canvasUserId);
    const { academicSemesterStr, academicYearStr } = req.params;
    const academicSemester = academicSemesterStr as SeasonTypeEnumValues;
    const academicYear = parseInt(academicYearStr);
    const academicYearAndSemesterFilterStr = `${academicYear} ${academicSemester}` as const;
    const assignmentRubricEntryArr = await CanvasCourseAssignmentRubricObjModel.find({
      canvasUserId: canvasUserId,
      canvasCourseAcademicSemesterOffered: academicSemester,
      canvasCourseAcademicYearOffered: academicYear
    });
    indexSpecific++;
    log.info(
      `END OF ASSIGNMENT RUBRIC STATS (SEMESTER: ${academicYearAndSemesterFilterStr}) GET REQUEST #${index} ---------------------`
    );
    return res.status(200).send(JSON.stringify(assignmentRubricEntryArr, null, 2));
  }
);

router.post("/api/statistics/assignment_rubric/:canvasCourseInternalId", async (req, res) => {
  const canvasCourseInternalId = parseInt(req.params.canvasCourseInternalId);
  const currStatEntry = req.body as CanvasCourseAssignmentRubricObjBase;
  try {
    const listedCourseLearningObjectives = await CourseObjectivesModel.findOne({
      canvasCourseInternalId: canvasCourseInternalId
    });
    if (!listedCourseLearningObjectives) {
      throw new Error("The specified Canvas learning-objectives for this course do not exist in the MongoDB database");
    }

    const { canvasObjectives } = listedCourseLearningObjectives;
    const stats = new CanvasAssignmentWithRubricStats(
      currStatEntry.rubricData,
      currStatEntry.recentSubmissionData,
      currStatEntry.canvasMatchedLearningObjectivesArr,
      canvasObjectives
    );
    const assignmentWithRubricStatResults = stats.computeAssignmentWithRubricStats();
    log.warn(assignmentWithRubricStatResults);
    log.info("STATUS: GOT HERE ASSIGNMENT WITH RUBRIC STAT -----------");
    return res.status(200).send(JSON.stringify(assignmentWithRubricStatResults, null, 2));
  } catch (err) {
    log.error("Error with interacting with the MongoDB database! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "POST",
      errorMsg: "No items found in MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as assignmentRubricStatsRouter };
