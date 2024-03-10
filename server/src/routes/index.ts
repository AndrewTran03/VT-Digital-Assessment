import express from "express";
import { canvasDataRouter } from "./canvas";
import { canvasObjectiveRouter } from "./objectives";
import { quizStatsRouter } from "./quiz.statistics";
import { assignmentRubricStatsRouter } from "./assignment.rubric.statistics";

const router = express.Router();

// Add other local routers here...
router.use(canvasDataRouter);
router.use(canvasObjectiveRouter);
router.use(quizStatsRouter);
router.use(assignmentRubricStatsRouter);

export default router;
