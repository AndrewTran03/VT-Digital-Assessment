import express from "express";

const router = express.Router();

router.get("/api/statistics/assignment_rubric", async (req, res) => {
  return res.status(200).send({ message: "GET endpoint works" });
});

router.post("/api/statistics/assignment_rubric", async (req, res) => {
  return res.status(201).send({ message: "POST endpoint works" });
});

export { router as assignmentRubricStatsRouter };
