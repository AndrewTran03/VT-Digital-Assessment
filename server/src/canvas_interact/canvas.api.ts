import axios, { AxiosError } from "axios";
import config from "config";
import log from "../utils/logger";
import {
  CanvasCourse,
  CanvasQuiz,
  CanvasQuizQuestion,
  CanvasQuizQuestionGroup,
  CanvasCourseInfo,
  CanvasQuizInfo
} from "../../assets/types";

const canvasUrl = "https://canvas.vt.edu:443/api";
const canvasPublicApiToken = config.get<string>("canvasPublicApiToken");

const axiosHeaders = {
  Authorization: `Bearer ${canvasPublicApiToken}`
};

// Gets your own Canvas User-Id (If Needed)
async function fetchCanvasUserInfo() {
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

// Returns a number[] of the Canvas user's available Course IDs
async function fetchCanvasUserCourseData() {
  console.clear();
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
    const courseRes = await axios.get(`${canvasUrl}/v1/courses`, {
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
    // log.info(`Length of ${role.toUpperCase()} array is ${currArr.length}`);
  }
  // log.info(`Total length is ${canvasCoursesArr.length}`);
  // log.info(canvasCoursesArr);

  // Extracts only the relevant information from Course data: CourseIds and CourseNames
  const courseArr: CanvasCourseInfo[] = canvasCoursesArr.map((item) => {
    // Split the course code string based on "_" or space characters
    const parts = (item.course_code || "").split(/[_\s]+/);
    // console.log(parts);

    // Extract relevant information from the parts
    const courseDept = parts[0];
    const courseNum = parseInt(parts[1]);
    // console.log("COURSE INFO:", courseDept, courseNum);

    return {
      courseId: item.id!,
      courseName: item.name!,
      courseDept: courseDept,
      courseNum: courseNum
    };
  });
  // log.info(`Course Info- ${courseArr}. Length: ${courseIdsArr.length}`);

  return courseArr;
}

// Returns a Map (described below) of the Canvas user's available Quiz IDs
async function fetchCanvasUserQuizData(courseArr: readonly CanvasCourseInfo[]) {
  console.clear();
  const canvasQuizAssociations = new Map<CanvasCourseInfo, Array<CanvasQuizQuestionGroup>>();
  // Get every available QUIZ of every Canvas course where the user is a TA or Course Instructor
  for (let j = 0; j < courseArr.length; j++) {
    const { courseId, courseName, courseDept, courseNum } = courseArr[j];

    const quizRes = await axios.get(`${canvasUrl}/v1/courses/${courseId}/quizzes`, {
      headers: axiosHeaders
    });

    let canvasQuizzesArr: CanvasQuiz[] = [];
    // Assigns each CanvasQuiz object to proper array index, then drops it (keeps object)
    // PREV: JSON - 0: { ...object... } => TS: arr[0] = ...object...
    const canvasQuizzesTemp: Record<number, CanvasCourse> = {};
    quizRes.data.forEach((quiz: CanvasQuiz, idx: number) => {
      // Handle Date parsing properly
      if (typeof quiz.show_correct_answers_at === "string") {
        quiz.show_correct_answers_at = new Date(quiz.show_correct_answers_at);
      }
      if (typeof quiz.hide_correct_answers_at === "string") {
        quiz.hide_correct_answers_at = new Date(quiz.hide_correct_answers_at);
      }
      if (typeof quiz.due_at === "string") {
        quiz.due_at = new Date(quiz.due_at);
      }
      if (typeof quiz.lock_at === "string") {
        quiz.lock_at = new Date(quiz.lock_at);
      }
      if (typeof quiz.unlock_at === "string") {
        quiz.unlock_at = new Date(quiz.unlock_at);
      }

      canvasQuizzesTemp[idx] = quiz;
    });
    canvasQuizzesArr = Object.values(canvasQuizzesTemp);

    // Extracts only the relevant information from Quiz data: Quiz Ids and Quiz Titles/Names
    const quizArr: CanvasQuizInfo[] = canvasQuizzesArr.map((item) => ({ quizId: item.id!, quizName: item.title! }));
    // log.info(`Course ID# ${courseId} and CourseName ${courseName}: Quiz IDs- ${quizArr}. Length: ${quizArr.length}`);

    await fetchCanvasUserQuizQuestionData(courseId, courseName, courseDept, courseNum, quizArr, canvasQuizAssociations);
  }

  return canvasQuizAssociations;
}

// End Result: A data structure as folows - Map { K: { CourseId, CourseName, CourseDept, CourseNum }, V: Array<{ QuizId, QuizQuestionsObj }> }
async function fetchCanvasUserQuizQuestionData(
  courseId: number,
  courseName: string,
  courseDept: string,
  courseNum: number,
  quizArr: CanvasQuizInfo[],
  canvasQuizAssociations: Map<CanvasCourseInfo, Array<CanvasQuizQuestionGroup>>
) {
  console.clear();
  // Get every QUESTION for every available quiz of every Canvas course where the user is a TA or Course Instructor
  for (let k = 0; k < quizArr.length; k++) {
    const { quizId, quizName } = quizArr[k];

    const quizQuestionsRes = await axios.get(`${canvasUrl}/v1/courses/${courseId}/quizzes/${quizId}/questions`, {
      headers: axiosHeaders
    });

    // Assigns each CanvasQuizQuestion object to proper array index, then drops it (keeps object)
    // PREV: JSON - 0: { ...object... } => TS: arr[0] = ...object...
    const canvasQuizQuestionTemp: Record<number, CanvasQuizQuestion> = {};
    quizQuestionsRes.data.forEach((quizQues: CanvasQuizQuestion, idx: number) => {
      canvasQuizQuestionTemp[idx] = quizQues;
    });
    const canvasCurrQuizQuestionsArr = Object.values(canvasQuizQuestionTemp);
    // log.info(`Course ID# ${courseId} and CourseName ${courseName}: Quiz ID# ${quizId}:, Quiz Name: ${quizName}, Quiz Length- ${canvasCurrQuizQuestionsArr.length}`);
    const quizMapEntry: CanvasQuizQuestionGroup = {
      quizId: quizId,
      quizName: quizName,
      questions: canvasCurrQuizQuestionsArr
    };

    // Map courseId existence check (and updating)
    const courseInfo: CanvasCourseInfo = {
      courseId: courseId,
      courseName: courseName,
      courseDept: courseDept,
      courseNum: courseNum
    };
    const mapAccess = canvasQuizAssociations.get(courseInfo);
    if (mapAccess === undefined) {
      canvasQuizAssociations.set(courseInfo, [quizMapEntry]);
    } else {
      mapAccess.push(quizMapEntry);
    }
  }
}

// Helper function to validate mapping process is correct
function checkQuizMapHelper(map: Map<number, Array<CanvasQuizQuestionGroup>>) {
  map.forEach((value, key) => {
    const quizEntryArr = value;
    log.info(`Course ID#${key} has ${value.length} quiz(zes).`);
    quizEntryArr.forEach(({ quizId, questions }) => {
      log.info(`Quiz ID#${quizId} has ${questions.length} question(s).`);
    });
  });
}

async function fetchCanvasUserInfoPublic(canvasAccountId: number, canvasUsername: string, canvasUserApiKey: string) {
  const publicAxiosHeaders = {
    Authorization: `${canvasUserApiKey}`
  };

  let userId = 0;
  const result = await axios
    .get(`${canvasUrl}/v1/accounts/${canvasAccountId}/users?search_term=${canvasUsername}@vt.edu`, {
      headers: publicAxiosHeaders
    })
    .then((res) => {
      console.log(res.config.url);
      const canvasUserId = res.data[0].id as number;
      log.info(`Canvas User ID: ${canvasUserId}`);
      userId = canvasUserId;
    })
    .catch((error) => {
      log.error(error);
      log.error("Error in retrieving the Canvas User ID");
      log.error(`More Descriptive Error Message: ${error}`);
      userId = -1;
    });
  return userId;
}

export {
  fetchCanvasUserInfo,
  fetchCanvasUserInfoPublic,
  fetchCanvasUserCourseData,
  fetchCanvasUserQuizData,
  fetchCanvasUserQuizQuestionData,
  checkQuizMapHelper
};
