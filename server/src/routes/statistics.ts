import express from "express";
import { fetchCanvasUserCourseData, fetchCanvasUserInfo } from "../canvas_interact/canvas.api";
import { fetchCanvasUserQuizReportData } from "../canvas_interact/canvas.stats";

const router = express.Router();

router.get("/api/statistics", async (_, res) => {
  const canvasUserId = await fetchCanvasUserInfo();
  const canvasUserCourseIds = await fetchCanvasUserCourseData();
  const canvasQuizStatisticArr = await fetchCanvasUserQuizReportData(canvasUserCourseIds);
  return res.status(200).send(JSON.stringify(canvasQuizStatisticArr, null, 2));
});

router.get("/api/statistics/:course_id", async (req, res) => {
  console.log(req.params.course_id);
  return res.status(201);
});

export { router as statsRouter };
