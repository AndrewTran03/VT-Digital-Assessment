import express from "express";
import log from "../utils/logger";
import { fetchCanvasUserCourseData } from "../canvas_interact/canvas.api";
import { fetchCanvasUserQuizReportData } from "../canvas_interact/canvas.stats";
import { getCanvasApiAuthHeaders } from "../utils/canvas.connection";

const router = express.Router();

let index = 0;
router.get("/api/statistics/:canvasUserId/:canvasCourseInternalId/:canvasQuizId", async (req, res) => {
  const canvasUserId = parseInt(req.params.canvasUserId);
  const axiosHeaders = await getCanvasApiAuthHeaders(canvasUserId);
  const canvasUserCourseIds = await fetchCanvasUserCourseData(axiosHeaders);
  const canvasQuizStatisticArr = await fetchCanvasUserQuizReportData(axiosHeaders, canvasUserCourseIds);
  log.info(`END OF STATS GET REQUEST #${index} ---------------------`);
  return res.status(200).send(JSON.stringify(canvasQuizStatisticArr, null, 2));
});

router.post("/api/statistics/:course_id", async (req, res) => {
  console.log(req.params.course_id);
  return res.status(201);
});

export { router as statsRouter };
