import axios from "axios";
import log from "../utils/logger";
import {
  canvasUrl,
  AxiosAuthHeaders,
  CanvasCourseInfo,
  CanvasQuizQuestionGroup,
  CanvasQuiz,
  CanvasCourse,
  CanvasQuizInfo,
  CanvasQuizQuestion,
  SeasonTypeEnumValues
} from "../shared/types";

// Returns a Map (described below) of the Canvas user's available Quiz IDs
async function fetchCanvasUserQuizData(
  axiosHeaders: AxiosAuthHeaders,
  courseArr: readonly CanvasCourseInfo[],
  academicSemesterFilter: SeasonTypeEnumValues,
  academicYearFilter: number
) {
  const canvasQuizAssociations = new Map<CanvasCourseInfo, Array<CanvasQuizQuestionGroup>>();

  // Get every available QUIZ of every Canvas course where the user is a TA or Course Instructor
  for (const { courseId, courseName, courseDept, courseNum } of courseArr) {
    const quizRes = await axios.get(`${canvasUrl}/v1/courses/${courseId}/quizzes?per_page=100`, {
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
      } else if (quiz.due_at === null) {
        quiz.due_at = null;
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
    const quizArr: CanvasQuizInfo[] = canvasQuizzesArr.map((item) => ({
      quizId: item.id!,
      quizName: item.title!,
      quizDueAt: item.due_at!,
      quizHtmlUrl: item.html_url!
    }));
    log.info(`ALL LISTED QUIZ NAMES FOR COURSE ID (${courseName}) THAT SEMESTER:`);
    quizArr.forEach((quiz) => {
      log.warn(`${quiz.quizName} (ID#${quiz.quizId})`);
    });

    await fetchCanvasUserQuizQuestionData(
      axiosHeaders,
      courseId,
      courseName,
      courseDept,
      courseNum,
      academicSemesterFilter,
      academicYearFilter,
      quizArr,
      canvasQuizAssociations
    );
  }

  return canvasQuizAssociations;
}

// End Result: A data structure as folows - Map { K: { CourseId, CourseName, CourseDept, CourseNum }, V: Array<{ QuizId, QuizQuestionsObj }> }
async function fetchCanvasUserQuizQuestionData(
  axiosHeaders: AxiosAuthHeaders,
  courseId: number,
  courseName: string,
  courseDept: string,
  courseNum: number,
  academicSemesterFilter: SeasonTypeEnumValues,
  academicYearFilter: number,
  quizArr: CanvasQuizInfo[],
  canvasQuizAssociations: Map<CanvasCourseInfo, Array<CanvasQuizQuestionGroup>>
) {
  console.clear();
  // Get every QUESTION for every available quiz of every Canvas course where the user is a TA or Course Instructor
  for (const { quizId, quizName, quizDueAt, quizHtmlUrl } of quizArr) {
    const quizQuestionsRes = await axios.get(
      `${canvasUrl}/v1/courses/${courseId}/quizzes/${quizId}/questions?per_page=100`,
      {
        headers: axiosHeaders
      }
    );

    // Assigns each CanvasQuizQuestion object to proper array index, then drops it (keeps object)
    // PREV: JSON - 0: { ...object... } => TS: arr[0] = ...object...
    const canvasQuizQuestionTemp: Record<number, CanvasQuizQuestion> = {};
    quizQuestionsRes.data.forEach((quizQues: CanvasQuizQuestion, idx: number) => {
      canvasQuizQuestionTemp[idx] = quizQues;
    });
    const canvasCurrQuizQuestionsArr = Object.values(canvasQuizQuestionTemp);
    const quizMapEntry: CanvasQuizQuestionGroup = {
      quizId: quizId,
      quizName: quizName,
      quizDueAt: quizDueAt,
      quizHtmlUrl: quizHtmlUrl,
      questions: canvasCurrQuizQuestionsArr
    };

    // Map courseId existence check (and updating)
    const courseInfo: CanvasCourseInfo = {
      courseId: courseId,
      courseName: courseName,
      courseDept: courseDept,
      courseNum: courseNum,
      courseAcademicSemesterOffered: academicSemesterFilter,
      courseAcademicYearOffered: academicYearFilter
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

export { fetchCanvasUserQuizData, fetchCanvasUserQuizQuestionData };
