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
    const response = await axios.get(`${canvasUrl}/v1/users/${canvasUserId}/courses`, {
        headers: {
            Authorization: `Bearer ${canvasPublicApiToken}`
        }
    });

    const canvasCourses: Record<number, CanvasCourse> = {};
    response.data.forEach((course: CanvasCourse, idx: number) => {
        canvasCourses[idx] = course;
    });

    const canvasCoursesArr = Object.values(canvasCourses);
    log.info(canvasCoursesArr);
    log.info("LENGTH IS: " + canvasCoursesArr.length);
}

export { fetchAndDisplayCanvasCourseData };
