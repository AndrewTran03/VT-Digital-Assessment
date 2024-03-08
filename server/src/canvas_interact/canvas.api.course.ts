import axios from "axios";
import log from "../utils/logger";
import { canvasUrl, AxiosAuthHeaders, CanvasCourse, CanvasCourseInfo } from "../shared/types";

// Returns a number[] of the Canvas user's available Course IDs
async function fetchCanvasUserCourseData(axiosHeaders: AxiosAuthHeaders) {
  let canvasCoursesArr: CanvasCourse[] = [];

  const enrollmentTypeRoles = ["teacher", "ta"];
  // Get every available COURSE where the user is a TA or Course Instructor of the Canvas course
  for (let i = 0; i < enrollmentTypeRoles.length; i++) {
    const role = enrollmentTypeRoles[i];

    const courseParams = {
      enrollment_type: role,
      enrollment_state: "active",
      state: ["available"]
    };
    const courseRes = await axios.get(`${canvasUrl}/v1/courses?per_page=100`, {
      params: courseParams,
      headers: axiosHeaders
    });

    // Assigns each CanvasCourse object to proper array index, then drops it (keeps object)
    // PREV: JSON - 0: { ...object... } => TS: arr[0] = ...object...
    const canvasCoursesTemp: Record<number, CanvasCourse> = {};
    courseRes.data.forEach((course: CanvasCourse, idx: number) => {
      // Handle Date parsing properly
      if (typeof course.created_at === "string") {
        course.created_at = new Date(course.created_at);
      }
      if (typeof course.start_at === "string") {
        course.start_at = new Date(course.start_at);
      }
      if (typeof course.end_at === "string") {
        course.end_at = new Date(course.end_at);
      }
      if (typeof course.course_progress?.completed_at === "string") {
        course.course_progress.completed_at = new Date(course.course_progress.completed_at);
      }
      if (typeof course.term?.start_at === "string") {
        course.term.start_at = new Date(course.term.start_at);
      }
      if (typeof course.term?.end_at === "string") {
        course.term.end_at = new Date(course.term.end_at);
      }

      canvasCoursesTemp[idx] = course;
    });
    const currArr = Object.values(canvasCoursesTemp);
    canvasCoursesArr = canvasCoursesArr.concat(currArr);
  }

  // Extracts only the relevant information from Course data: CourseIds and CourseNames
  const courseArr: CanvasCourseInfo[] = canvasCoursesArr.map((item) => {
    // Split the course code string based on "_" or space characters
    const parts = (item.course_code || "").split(/[_\s]+/);

    // Extract relevant information from the parts
    const courseDept = parts[0];
    const courseNum = parseInt(parts[1]);

    return {
      courseId: item.id!,
      courseName: item.name!,
      courseDept: courseDept,
      courseNum: courseNum
    };
  });

  return courseArr;
}

export { fetchCanvasUserCourseData };
