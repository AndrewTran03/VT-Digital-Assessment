import axios, { AxiosError } from "axios";
import config from "config";
import log from "../utils/logger";
import {
  canvasUrl,
  CanvasCourse,
  CanvasCourseInfo,
  CanvasQuiz,
  CanvasQuizInfo,
  CanvasQuizQuestionAnswerStatistic,
  CanvasQuizQuestionPointBiserial,
  CanvasQuizQuestionStatistic,
  CanvasQuizStatistic,
  CanvasQuizSubmissionStatistics,
  QuestionTypeEnumValues,
  AxiosAuthHeaders
} from "../../assets/types";

async function fetchCanvasUserQuizReportData(axiosHeaders: AxiosAuthHeaders, courseArr: readonly CanvasCourseInfo[]) {
  const quizStatsResponses: CanvasQuizStatistic[] = [];

  // Get every available QUIZ of every Canvas course where the user is a TA or Course Instructor
  for (let j = 0; j < courseArr.length; j++) {
    const { courseId } = courseArr[j];

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

    await fetchCanvasUserQuizAnswerReportData(axiosHeaders, courseId, quizArr, quizStatsResponses);
  }
  log.info(quizStatsResponses.length);
  return quizStatsResponses;
}

// End Result: A data structure as folows - Map { K: { CourseId, CourseName, CourseDept, CourseNum }, V: Array<{ QuizId, QuizQuestionsObj }> }
async function fetchCanvasUserQuizAnswerReportData(
  axiosHeaders: AxiosAuthHeaders,
  courseId: number,
  quizArr: readonly CanvasQuizInfo[],
  quizStatsResponses: CanvasQuizStatistic[]
) {
  // Get every QUIZ QUESTION (W/ ANSWERS) REPORT for every available quiz of every Canvas course where the user is a TA or Course Instructor
  for (let k = 0; k < quizArr.length; k++) {
    const { quizId } = quizArr[k];

    const quizQuestionsRes = await axios.get(`${canvasUrl}/v1/courses/${courseId}/quizzes/${quizId}/statistics`, {
      headers: axiosHeaders
    });
    console.assert(quizQuestionsRes.data.quiz_statistics.length === 1);

    const newCanvasQuizStatistic = parseCanvasQuizQuestionStatResultHelper(quizQuestionsRes.data.quiz_statistics[0]);
    quizStatsResponses.push(newCanvasQuizStatistic);
  }
  log.warn(quizStatsResponses);
}

function parseCanvasQuizQuestionStatResultHelper(quizStatsEntry: any) {
  const id = quizStatsEntry.id as number;
  const url = quizStatsEntry.url;
  const html_url = quizStatsEntry.html_url;
  const multiple_attempts_exist = quizStatsEntry.multiple_attempts_exist as boolean;
  const generated_at = quizStatsEntry.generated_at;
  const includes_all_versions = quizStatsEntry.includes_all_versions as boolean;
  const includes_sis_ids = quizStatsEntry.includes_sis_ids as boolean;
  const points_possible = quizStatsEntry.points_possible as number;
  const anonymous_survey = quizStatsEntry.anonymous_survey as boolean;
  const speed_grader_url = quizStatsEntry.speed_grader_url;
  const quiz_submissions_zip_url = quizStatsEntry.quiz_submissions_zip_url;

  const question_statistics: CanvasQuizQuestionStatistic[] = [];
  if (quizStatsEntry.question_statistics && quizStatsEntry.question_statistics.length > 0) {
    quizStatsEntry.question_statistics.forEach((quesStatEntry: any) => {
      const id = quesStatEntry.id as number;
      const question_type = quesStatEntry.question_type as QuestionTypeEnumValues;
      const question_text = quesStatEntry.question_text;
      const position = quesStatEntry.position as number;
      const responses = quesStatEntry.responses as number;

      const answers: CanvasQuizQuestionAnswerStatistic[] = [];
      if (quesStatEntry.answers && quesStatEntry.answers.length > 0) {
        quesStatEntry.answers.forEach((answerEntry: any) => {
          const answerId = answerEntry.id as number;
          const answerText = answerEntry.text as string;
          const isCorrect = answerEntry.correct as boolean;
          const responseCount = answerEntry.responses as number;
          const userIds: number[] = answerEntry.user_ids as number[];
          const userNames: string[] = answerEntry.user_names as string[];

          const newAnswer: CanvasQuizQuestionAnswerStatistic = {
            id: answerId,
            text: answerText,
            correct: isCorrect,
            responses: responseCount,
            user_ids: userIds,
            user_names: userNames
          };
          answers.push(newAnswer);
        });
      }
      const answered_student_count = quesStatEntry.answered_student_count as number;
      const top_student_count = quesStatEntry.top_student_count as number;
      const middle_student_count = quesStatEntry.middle_student_count as number;
      const bottom_student_count = quesStatEntry.bottom_student_count as number;
      const correct_student_count = quesStatEntry.correct_student_count as number;
      const incorrect_student_count = quesStatEntry.incorrect_student_count as number;
      const correct_student_ratio = quesStatEntry.correct_student_ratio as number;
      const incorrect_student_ratio = quesStatEntry.incorrect_student_ratio as number;
      const correct_top_student_count = quesStatEntry.correct_top_student_count as number;
      const correct_middle_student_count = quesStatEntry.correct_middle_student_count as number;
      const correct_bottom_student_count = quesStatEntry.correct_bottom_student_count as number;
      const variance = quesStatEntry.variance as number;
      const stdev = quesStatEntry.stdev as number;
      const difficulty_index = quesStatEntry.difficulty_index as number;
      const alpha = quesStatEntry.alpha as number;

      const point_biserials: CanvasQuizQuestionPointBiserial[] = [];
      if (quesStatEntry.point_biserials && quesStatEntry.point_biserials.length > 0) {
        quesStatEntry.point_biserials.forEach((pointBiserialEntry: any) => {
          const answerId = pointBiserialEntry.answer_id as number;
          const pointBiserial = pointBiserialEntry.point_biserial as number | null;
          const correct = pointBiserialEntry.correct as boolean;
          const distractor = pointBiserialEntry.distractor as boolean;

          const newPointerBiserialEntry: CanvasQuizQuestionPointBiserial = {
            answer_id: answerId,
            point_biserial: pointBiserial,
            correct: correct,
            distractor: distractor
          };
          point_biserials.push(newPointerBiserialEntry);
        });
      }

      const newQuesStat: CanvasQuizQuestionStatistic = {
        id: id,
        question_type: question_type,
        question_text: question_text,
        position: position,
        responses: responses,
        answers: answers,
        answered_student_count: answered_student_count,
        top_student_count: top_student_count,
        middle_student_count: middle_student_count,
        bottom_student_count: bottom_student_count,
        correct_student_count: correct_student_count,
        incorrect_student_count: incorrect_student_count,
        correct_student_ratio: correct_student_ratio,
        incorrect_student_ratio: incorrect_student_ratio,
        correct_top_student_count: correct_top_student_count,
        correct_middle_student_count: correct_middle_student_count,
        correct_bottom_student_count: correct_bottom_student_count,
        variance: variance,
        stdev: stdev,
        difficulty_index: difficulty_index,
        alpha: alpha,
        point_biserials: point_biserials
      };
      question_statistics.push(newQuesStat);
    });
  }
  const submission_statistics: CanvasQuizSubmissionStatistics = {
    scores: quizStatsEntry.submission_statistics.scores as Record<string, number>,
    score_average: quizStatsEntry.submission_statistics.score_average as number | null,
    score_high: quizStatsEntry.submission_statistics.score_high as number | null,
    score_low: quizStatsEntry.submission_statistics.score_low as number | null,
    score_stdev: quizStatsEntry.submission_statistics.score_stdev as number | null,
    correct_count_average: quizStatsEntry.submission_statistics.correct_count_average as number,
    incorrect_count_average: quizStatsEntry.submission_statistics.incorrect_count_average as number,
    duration_average: quizStatsEntry.submission_statistics.duration_average as number,
    unique_count: quizStatsEntry.submission_statistics.unique_count as number
  };
  const links = { quiz: quizStatsEntry.links.quiz };

  const newCanvasQuizStatistic: CanvasQuizStatistic = {
    id: id,
    url: url,
    html_url: html_url,
    multiple_attempts_exist: multiple_attempts_exist,
    generated_at: generated_at,
    includes_all_versions: includes_all_versions,
    includes_sis_ids: includes_sis_ids,
    points_possible: points_possible,
    anonymous_survey: anonymous_survey,
    speed_grader_url: speed_grader_url,
    quiz_submissions_zip_url: quiz_submissions_zip_url,
    question_statistics: question_statistics,
    submission_statistics: submission_statistics,
    links: links
  };

  return newCanvasQuizStatistic;
}

export { fetchCanvasUserQuizReportData, fetchCanvasUserQuizAnswerReportData };
