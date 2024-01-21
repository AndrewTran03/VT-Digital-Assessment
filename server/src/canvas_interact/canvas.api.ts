import axios from "axios";
import config from "config";
import log from "../utils/logger";
import { CanvasCourse } from "../../assets/types";

const canvasUrl = "https://canvas.vt.edu:443/api";
const canvasPublicApiToken = config.get<string>("canvasPublicApiToken");

async function fetchAndDisplayCanvasCourseData() {
  const userData = await axios.get(`${canvasUrl}/v1/users/self`, {
    headers: {
      Authorization: `Bearer ${canvasPublicApiToken}`
    }
  });
  const canvasUserId = userData.data.id;
  log.info(canvasUserId);

  console.clear();
  let canvasCoursesArr: CanvasCourse[] = [];
  const enrollmentTypeRoles = ["ta", "teacher"];
  for (let i = 0; i < enrollmentTypeRoles.length; i++) {
    const role = enrollmentTypeRoles[i];

    const courseParams = {
      enrollment_type: role,
      enrollment_state: "active",
      state: ["available"]
    };
    const response = await axios.get(`${canvasUrl}/v1/courses`, {
      params: courseParams,
      headers: {
        Authorization: `Bearer ${canvasPublicApiToken}`
      }
    });

    const canvasCourses: Record<number, CanvasCourse> = {};
    response.data.forEach((course: CanvasCourse, idx: number) => {
      canvasCourses[idx] = course;
    });

    const currArr = Object.values(canvasCourses);
    canvasCoursesArr = canvasCoursesArr.concat(currArr);
    log.info(currArr);
    log.info(`Length of ${role} array is ${currArr.length}`);
  }
  log.info(`Total length is ${canvasCoursesArr.length}`);
}

export { fetchAndDisplayCanvasCourseData };
