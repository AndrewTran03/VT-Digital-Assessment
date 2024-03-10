import axios, { AxiosError } from "axios";
import log from "../utils/logger";
import { canvasUrl, AxiosAuthHeaders } from "../shared/types";

async function fetchCanvasUserInfoAdmin(
  axiosHeaders: AxiosAuthHeaders,
  canvasAccountId: number,
  canvasUsername: string
) {
  return await axios
    .get(`${canvasUrl}/v1/accounts/${canvasAccountId}/users?search_term=${canvasUsername}@vt.edu`, {
      headers: axiosHeaders
    })
    .then((res) => {
      console.log(res.config.url);
      const canvasUserId = res.data[0].id as number;
      log.info(`Canvas User ID: ${canvasUserId}`);
      return canvasUserId;
    })
    .catch((error) => {
      log.error(error);
      log.error("Error in retrieving the Canvas User ID");
      log.error(`More Descriptive Error Message: ${error}`);
      return -1;
    });
}

// Gets your own Canvas User-Id (If Needed)
async function fetchCanvasUserInfoRegUser(axiosHeaders: AxiosAuthHeaders) {
  return await axios
    .get(`${canvasUrl}/v1/users/self`, {
      headers: axiosHeaders
    })
    .then((res) => {
      const canvasUserId = res.data.id as number;
      log.info(`Canvas User ID: ${canvasUserId}`);
      return canvasUserId;
    })
    .catch((error: AxiosError) => {
      log.error("Error in retrieving the Canvas User ID");
      log.error(`More Descriptive Error Message: ${error.message}`);
      return -1;
    });
}

export { fetchCanvasUserInfoRegUser, fetchCanvasUserInfoAdmin };
