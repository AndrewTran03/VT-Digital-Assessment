import express from "express";
import log from "../utils/logger";
import { APIErrorResponse } from "../../assets/types";
import { fetchCanvasQuizData } from "../canvas_interact/canvas.api";

const router = express.Router();

let index = 0;
router.get("/api/canvas", async (_, res) => {
  try {
    const canvasResults = await fetchCanvasQuizData();

    index++;
    log.info(`END OF GET REQUEST #${index} ------------------------`);
    return res.status(200).json(canvasResults);
  } catch (err) {
    log.error("Error with interacting the Canvas API! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "Error with interacting the Canvas API"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as canvasDataRouter };
