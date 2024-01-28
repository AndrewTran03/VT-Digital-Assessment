import log from "./logger";
import { fetchCanvasUserInfo } from "../canvas_interact/canvas.api";

async function ensureConnectionToCanvasApi() {
  try {
    const canvasUserId = await fetchCanvasUserInfo();
    if (canvasUserId == -1) {
      throw new Error("Failed to connect to Canvas API . Exiting now...");
    }
    log.info("Sucessfully initiated connection to the Canvas API");
  } catch (err: any) {
    const error = err as Error;
    log.error(`${error.message}`);
    process.exit(1);
  }
}

export { ensureConnectionToCanvasApi };
