import express from "express";

const router = express.Router();

router.get("/api/objective", async (req, res) => {
  // const data = req.body;
});

router.post("/api/objective", async (req, res) => {
  const data = req.body;
  console.log(data);
});

export { router as canvasObjectiveRouter };
