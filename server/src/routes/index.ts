import express from "express";
import { canvasDataRouter } from "./canvas";
import { canvasObjectiveRouter } from "./objectives";
import { statsRouter } from "./statistics";

const router = express.Router();

// Add other local routers here...
router.use(canvasDataRouter);
router.use(canvasObjectiveRouter);
router.use(statsRouter);

export default router;
