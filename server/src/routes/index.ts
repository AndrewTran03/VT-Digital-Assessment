import express from "express";

import { exampleRouter } from "./example";

const router = express.Router();

router.use(exampleRouter); // TODO: Remove this one later
// Add other local routers here...

export default router;
