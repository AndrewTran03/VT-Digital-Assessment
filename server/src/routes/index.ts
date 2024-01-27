import express from "express";

import { exampleRouter } from "./example";
import { canvasDataRouter } from "./canvas";
import { canvasObjectiveRouter } from "./objectives";

const router = express.Router();

router.use(exampleRouter); // TODO: Remove this one later
// Add other local routers here...
router.use(canvasDataRouter);
router.use(canvasObjectiveRouter);

export default router;
