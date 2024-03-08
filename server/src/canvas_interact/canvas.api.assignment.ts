import axios from "axios";
import log from "../utils/logger";
import { canvasUrl, AxiosAuthHeaders, CanvasCourseInfo } from "../shared/types";

// Returns a Map (described below) of the Canvas user's available Quiz IDs
async function fetchCanvasUserAssignmentData(axiosHeaders: AxiosAuthHeaders, courseArr: readonly CanvasCourseInfo[]) {
  // Get every available Assignment of every Canvas course where the user is a TA or Course Instructor
  for (let j = 0; j < courseArr.length; j++) {
    const { courseId, courseName, courseDept, courseNum } = courseArr[j];
    const assignmentRes = await axios.get(`${canvasUrl}/v1/courses/${courseId}/assignments?per_page=100`, {
      headers: axiosHeaders
    });

    log.warn(`Assignment Index ${j}: ---------------------------------`);
    log.info(assignmentRes.data);
  }
  return true;
}
