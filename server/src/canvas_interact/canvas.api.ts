import axios from "axios";
import config from "config";
import log from "../utils/logger";
import { CanvasCourse, CanvasQuiz, CanvasQuizQuestion } from "../../assets/types";

const canvasUrl = "https://canvas.vt.edu:443/api";
const canvasPublicApiToken = config.get<string>("canvasPublicApiToken");

const axiosHeaders = {
  Authorization: `Bearer ${canvasPublicApiToken}`
};

// End Result: A data structure as folows - Map { K: CourseId, V: Map { K: QuizId, V: QuizQuestionsObj }}
async function fetchCanvasQuizData() {
  // Gets your own Canvas User-Id (If Needed)
  // const userData = await axios.get(`${canvasUrl}/v1/users/self`, {
  //   headers: axiosHeaders
  // });
  // const canvasUserId = userData.data.id;
  // log.info(canvasUserId);

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
    log.info(`Length of ${role.toUpperCase()} array is ${currArr.length}`);
  }
  log.info(`Total length is ${canvasCoursesArr.length}`);

  // Extracts only the relevant information from Course data: CourseIds
  const courseIdsArr: number[] = canvasCoursesArr.map((item) => item.id!);
  log.info(`Course IDs- ${courseIdsArr}. Length: ${courseIdsArr.length}`);

  // Resultant Data Structure to Organize Course_Id -> Quiz_Id -> Quiz_Question(s)
  const canvasQuizAssociations = new Map<number, Array<Map<number, CanvasQuizQuestion[]>>>();

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
    log.info(`Course ID# ${courseId}: Quiz IDs- ${quizIdsArr}. Length: ${quizIdsArr.length}`);

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
      log.info(`Course ID# ${courseId}: Quiz ID# ${quizId}: Quiz Length- ${canvasCurrQuizQuestionsArr.length}`);
      const quizMapEntry: Map<number, CanvasQuizQuestion[]> = new Map([[quizId, canvasCurrQuizQuestionsArr]]);

      // Map courseId existence check (and updating)
      const mapAccess = canvasQuizAssociations.get(courseId);
      if (mapAccess === undefined) {
        canvasQuizAssociations.set(courseId, [quizMapEntry]);
      } else {
        mapAccess.push(quizMapEntry);
      }
    }
  }

  checkFinalSizeHelper(canvasQuizAssociations);
}

// Helper function to validate mapping process is correct
function checkFinalSizeHelper(map: Map<number, Array<Map<number, CanvasQuizQuestion[]>>>) {
  map.forEach((value, key) => {
    const quizEntryArr = value;
    log.info(`Course ID#${key} has ${value.length} quiz(zes).`);
    quizEntryArr.forEach((value) => {
      const quizEntry = value;
      quizEntry.forEach((value, key) => {
        log.info(`Quiz ID#${key} has ${value.length} question(s).`);
      });
    });
  });
}

export { fetchCanvasQuizData };
