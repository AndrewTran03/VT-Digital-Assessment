import express from "express";
import { canvasDataRouter } from "./canvas";
import { canvasObjectiveRouter } from "./objectives";

const router = express.Router();

// Add other local routers here...
router.use(canvasDataRouter);
router.use(canvasObjectiveRouter);

export default router;
