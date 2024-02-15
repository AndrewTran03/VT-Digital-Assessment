import express from "express";
import { CourseObjectivesModel, canvasObjectivesMongoCollectionName } from "../models/objectives.model";
import log from "../utils/logger";
import { CanvasCourseSingleCourseObjective, APIErrorResponse } from "../../assets/types";

const router = express.Router();

router.get("/api/objective", async (_, res) => {
  try {
    const currItems = await CourseObjectivesModel.find();

    const newCourseObjectives: CanvasCourseSingleCourseObjective[] = [];

    currItems.forEach((item, idx) => {
      const newCourseObjectiveParsed: CanvasCourseSingleCourseObjective = {
        deptAbbrev: item.deptAbbrev,
        courseNum: item.courseNum,
        semester: item.semester,
        year: item.year,
        canvasCourseInternalId: item.canvasCourseInternalId,
        canvasObjective: item.canvasObjectives[idx]
      };
      newCourseObjectives.push(newCourseObjectiveParsed);
    });

    return res.status(200).json(currItems);
  } catch (err) {
    log.error("Did not find any Canvas course objectives for any course! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "No items found in MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

router.get("/api/objective/:canvasIdCode", async (req, res) => {
  const canvasIdCode = parseInt(req.params.canvasIdCode);
  try {
    const currItems = await CourseObjectivesModel.find({ canvasCourseInternalId: canvasIdCode });

    const newCourseObjectives: CanvasCourseSingleCourseObjective[] = [];

    currItems.forEach((item, idx) => {
      const newCourseObjectiveParsed: CanvasCourseSingleCourseObjective = {
        deptAbbrev: item.deptAbbrev,
        courseNum: item.courseNum,
        semester: item.semester,
        year: item.year,
        canvasCourseInternalId: item.canvasCourseInternalId,
        canvasObjective: item.canvasObjectives[idx]
      };
      newCourseObjectives.push(newCourseObjectiveParsed);
    });

    return res.status(200).json(currItems);
  } catch (err) {
    log.error("Did not find any Canvas course objectives with that course internal ID! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "No items found in MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

router.get("/api/objective/course/:deptAbbrev/:courseNum", async (req, res) => {
  const canvasDeptAbbrev = req.params.deptAbbrev;
  const canvasCourseNum = parseInt(req.params.courseNum);
  try {
    const currItems = await CourseObjectivesModel.find({ deptAbbrev: canvasDeptAbbrev, courseNum: canvasCourseNum });

    const newCourseObjectives: CanvasCourseSingleCourseObjective[] = [];

    currItems.forEach((item, idx) => {
      const newCourseObjectiveParsed: CanvasCourseSingleCourseObjective = {
        deptAbbrev: item.deptAbbrev,
        courseNum: item.courseNum,
        semester: item.semester,
        year: item.year,
        canvasCourseInternalId: item.canvasCourseInternalId,
        canvasObjective: item.canvasObjectives[idx]
      };
      newCourseObjectives.push(newCourseObjectiveParsed);
    });

    return res.status(200).json(currItems);
  } catch (err) {
    log.error(
      "Did not find any Canvas course objectives with that department name and course number! Please try again!"
    );
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "No items found in MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

router.post("/api/objective", async (req, res) => {
  const newCourseObjectives: CanvasCourseSingleCourseObjective[] = req.body;
  const { deptAbbrev, courseNum, semester, year, canvasCourseInternalId } = newCourseObjectives[0];

  const newCourseObjectivesArr: string[] = [];
  newCourseObjectives.forEach((entry) => {
    newCourseObjectivesArr.push(entry.canvasObjective.replace(/\"|\r/g, ""));
  });
  const courseObjectivesToInsert = new CourseObjectivesModel({
    deptAbbrev: deptAbbrev,
    courseNum: courseNum,
    semester: semester,
    year: year,
    canvasCourseInternalId: canvasCourseInternalId,
    canvasObjectives: newCourseObjectivesArr
  });

  try {
    const courseObjectivesInsertResult = await courseObjectivesToInsert.save();
    log.info("Inserted the specified course objectives successfully! Congratulations!");
    return res.status(201).json(courseObjectivesInsertResult); // 201 = Successful Resource Creation
  } catch (err) {
    log.error("Could not insert the specified course objectives! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "POST",
      errorMsg: "Failed to insert into the MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as canvasObjectiveRouter };
