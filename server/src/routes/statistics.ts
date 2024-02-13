import express from "express";

const router = express.Router();

router.get("/api/statistics", async (req, res) => {
  console.log("Hi");
  return res.status(200);
});

router.get("/api/statistics/:course_id", async (req, res) => {
  console.log(req.params.course_id);
  return res.status(201);
});

export { router as statsRouter };
