import log from "./logger";
import config from "config";
import { fetchCanvasUserInfoRegUser } from "../canvas_interact/canvas.api.shared";
import { CanvasUserApiModel } from "../models/canvas.user.api.model";
import { AxiosAuthHeaders } from "../shared/types";

const fallbackCanvasApiKey = config.get<string>("canvasPublicApiToken"); // Andrew Tran's API token (fallback)

async function ensureConnectionToCanvasApi() {
  const axiosHeaders: AxiosAuthHeaders = {
    Authorization: `Bearer ${fallbackCanvasApiKey}`
  };

  try {
    const canvasUserId = await fetchCanvasUserInfoRegUser(axiosHeaders);
    if (canvasUserId == -1) {
      throw new Error("Failed to connect to Canvas API. Exiting now...");
    }
    log.info("Successfully initiated connection to the Canvas API");
  } catch (err: any) {
    const error = err as Error;
    log.error(`${error.message}`);
    process.exit(1);
  }
}

async function getCanvasApiAuthHeaders(canvasUserId: number) {
  let usedCanvasAPIKey = "";
  try {
    if (canvasUserId === -1) {
      throw new Error("Invalid Canvas User ID...not attempting to search MongoDB database");
    }
    const canvasUserApiKeyFindResult = await CanvasUserApiModel.findOne({ canvasUserId: canvasUserId });
    if (!canvasUserApiKeyFindResult) {
      throw new Error("Invalid search for Canvas User Information within MongoDB database");
    }
    usedCanvasAPIKey = canvasUserApiKeyFindResult.canvasUserApiKey;
  } catch (err) {
    log.error((err as Error).message);
    usedCanvasAPIKey = fallbackCanvasApiKey;
  }

  const axiosHeaders: AxiosAuthHeaders = {
    Authorization: `Bearer ${usedCanvasAPIKey}`
  };

  return axiosHeaders;
}

export { ensureConnectionToCanvasApi, getCanvasApiAuthHeaders };
