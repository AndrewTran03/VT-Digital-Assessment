import axios, { AxiosError } from "axios";
import config from "config";
import log from "../utils/logger";
import { CanvasCourse, CanvasQuiz, CanvasQuizQuestion, CanvasQuizQuestionGroup } from "../../assets/types";

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

  // Extracts only the relevant information from Course data: CourseIds
  const courseIdsArr = canvasCoursesArr.map((item) => item.id!);
  // log.info(`Course IDs- ${courseIdsArr}. Length: ${courseIdsArr.length}`);

  return courseIdsArr;
}

// Returns a Map (described below) of the Canvas user's available Quiz IDs
async function fetchCanvasUserQuizData(courseIdsArr: readonly number[]) {
  console.clear();
  const canvasQuizAssociations = new Map<number, Array<CanvasQuizQuestionGroup>>();
  // Get every available QUIZ of every Canvas course where the user is a TA or Course Instructor
  for (let j = 0; j < courseIdsArr.length; j++) {
    const courseId = courseIdsArr[j];

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

    // Extracts only the relevant information from Quiz data: QuizIds
    const quizIdsArr = canvasQuizzesArr.map((item) => item.id!);
    // log.info(`Course ID# ${courseId}: Quiz IDs- ${quizIdsArr}. Length: ${quizIdsArr.length}`);

    await fetchCanvasUserQuizQuestionData(courseId, quizIdsArr, canvasQuizAssociations);
  }

  return canvasQuizAssociations;
}

// End Result: A data structure as folows - Map { K: CourseId, V: Array<{ QuizId, QuizQuestionsObj }> }
async function fetchCanvasUserQuizQuestionData(
  courseId: number,
  quizIdsArr: number[],
  canvasQuizAssociations: Map<number, Array<CanvasQuizQuestionGroup>>
) {
  console.clear();
  // Get every QUESTION for every available quiz of every Canvas course where the user is a TA or Course Instructor
  for (let k = 0; k < quizIdsArr.length; k++) {
    const quizId = quizIdsArr[k];

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
    // log.info(`Course ID# ${courseId}: Quiz ID# ${quizId}: Quiz Length- ${canvasCurrQuizQuestionsArr.length}`);
    const quizMapEntry: CanvasQuizQuestionGroup = { quizId: quizId, questions: canvasCurrQuizQuestionsArr };

    // Map courseId existence check (and updating)
    const mapAccess = canvasQuizAssociations.get(courseId);
    if (mapAccess === undefined) {
      canvasQuizAssociations.set(courseId, [quizMapEntry]);
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

export {
  fetchCanvasUserInfo,
  fetchCanvasUserCourseData,
  fetchCanvasUserQuizData,
  fetchCanvasUserQuizQuestionData,
  checkQuizMapHelper
};
