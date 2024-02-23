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
  AxiosAuthHeaders,
  numberLike,
  booleanLike,
  numberArrLike,
  CanvasQuizQuestionAnswerSetStatistic
} from "../../assets/types";

async function fetchCanvasUserQuizReportData(axiosHeaders: AxiosAuthHeaders, courseArr: readonly CanvasCourseInfo[]) {
  const quizStatsResponses: CanvasQuizStatistic[] = [];

  // Get every available QUIZ of every Canvas course where the user is a TA or Course Instructor
  for (let j = 0; j < courseArr.length; j++) {
    const { courseId } = courseArr[j];

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

    const quizQuestionsRes = await axios.get(
      `${canvasUrl}/v1/courses/${courseId}/quizzes/${quizId}/statistics?per_page=100`,
      {
        headers: axiosHeaders
      }
    );
    console.assert(quizQuestionsRes.data.quiz_statistics.length === 1);

    const newCanvasQuizStatistic = parseCanvasQuizQuestionStatResultHelper(quizQuestionsRes.data.quiz_statistics[0]);
    quizStatsResponses.push(newCanvasQuizStatistic);
  }
  log.info(quizStatsResponses);
}

function parseCanvasQuizQuestionStatResultHelper(quizStatsEntry: any) {
  const defaultValue = null;

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
      // For "numerical_question" type questions
      const full_credit: numberLike = (quesStatEntry.full_credit as number) ?? defaultValue;
      const incorrect: numberLike = (quesStatEntry.incorrect as number) ?? defaultValue;
      // For "numerical_question, short_answer, and multiple_dropdowns" type questions
      const correct: numberLike = (quesStatEntry.correct as number) ?? defaultValue;
      // For "multiple_dropdowns" type questions
      const partially_correct: numberLike = (quesStatEntry.partially_correct as number) ?? defaultValue;

      const answerSets: CanvasQuizQuestionAnswerSetStatistic[] = [];
      const answers: CanvasQuizQuestionAnswerStatistic[] = [];
      // For "multiple_dropdowns" type questions
      if (quesStatEntry.answer_sets && quesStatEntry.answer_sets.length > 0) {
        quesStatEntry.answer_sets.forEach((answer_set: any) => {
          const answerSetId = answer_set.id as string;
          const answerSetText = answer_set.text as string;
          const answersForAnswerSet: CanvasQuizQuestionAnswerStatistic[] = [];
          if (answer_set.answers && answer_set.answers.length > 0) {
            answer_set.answers.forEach((answerEntry: any) => {
              const answerId = answerEntry.id as string;
              const answerText = answerEntry.text as string;
              const isCorrect = answerEntry.correct as boolean;
              const responseCount = answerEntry.responses as number;
              const userIds: number[] = answerEntry.user_ids as number[];
              const userNames: string[] = answerEntry.user_names as string[];
              const margin = null;
              const isRange = null;
              const value = null;

              const newAnswer: CanvasQuizQuestionAnswerStatistic = {
                id: answerId,
                text: answerText,
                correct: isCorrect,
                responses: responseCount,
                user_ids: userIds,
                user_names: userNames,
                margin: margin,
                isRange: isRange,
                value: value
              };
              answersForAnswerSet.push(newAnswer);
            });
          }
          const newAnswerSet: CanvasQuizQuestionAnswerSetStatistic = {
            id: answerSetId,
            text: answerSetText,
            answers: answersForAnswerSet
          };
          answerSets.push(newAnswerSet);
        });
      }
      // For all other type of questions
      else if (quesStatEntry.answers && quesStatEntry.answers.length > 0) {
        quesStatEntry.answers.forEach((answerEntry: any) => {
          const answerId = answerEntry.id as string;
          const answerText = answerEntry.text as string;
          const isCorrect = answerEntry.correct as boolean;
          const responseCount = answerEntry.responses as number;
          const userIds: number[] = answerEntry.user_ids as number[];
          const userNames: string[] = answerEntry.user_names as string[];
          // For "numerical_question" type questions
          const margin: numberLike = (answerEntry.margin as number) ?? defaultValue;
          const isRange: booleanLike = (answerEntry.is_range as boolean) ?? defaultValue;
          // For (some) "numerical_question" type questions
          const value: numberArrLike = (answerEntry.value as number[]) ?? defaultValue;

          const newAnswer: CanvasQuizQuestionAnswerStatistic = {
            id: answerId,
            text: answerText,
            correct: isCorrect,
            responses: responseCount,
            user_ids: userIds,
            user_names: userNames,
            margin: margin,
            isRange: isRange,
            value: value
          };
          answers.push(newAnswer);
        });
      }
      const answered_student_count: numberLike = (quesStatEntry.answered_student_count as number) ?? defaultValue;
      const top_student_count: numberLike = (quesStatEntry.top_student_count as number) ?? defaultValue;
      const middle_student_count: numberLike = (quesStatEntry.middle_student_count as number) ?? defaultValue;
      const bottom_student_count: numberLike = (quesStatEntry.bottom_student_count as number) ?? defaultValue;
      const correct_student_count: numberLike = (quesStatEntry.correct_student_count as number) ?? defaultValue;
      const incorrect_student_count: numberLike = (quesStatEntry.incorrect_student_count as number) ?? defaultValue;
      const correct_student_ratio: numberLike = (quesStatEntry.correct_student_ratio as number) ?? defaultValue;
      const incorrect_student_ratio: numberLike = (quesStatEntry.incorrect_student_ratio as number) ?? defaultValue;
      const correct_top_student_count: numberLike = (quesStatEntry.correct_top_student_count as number) ?? defaultValue;
      const correct_middle_student_count: numberLike =
        (quesStatEntry.correct_middle_student_count as number) ?? defaultValue;
      const correct_bottom_student_count: numberLike =
        (quesStatEntry.correct_bottom_student_count as number) ?? defaultValue;
      const variance: numberLike = (quesStatEntry.variance as number) ?? defaultValue;
      const stdev: numberLike = (quesStatEntry.stdev as number) ?? defaultValue;
      const difficulty_index: numberLike = (quesStatEntry.difficulty_index as number) ?? defaultValue;
      const alpha: numberLike = (quesStatEntry.alpha as number) ?? defaultValue;

      const point_biserials: CanvasQuizQuestionPointBiserial[] = [];
      if (quesStatEntry.point_biserials && quesStatEntry.point_biserials.length > 0) {
        quesStatEntry.point_biserials.forEach((pointBiserialEntry: any) => {
          const answerId = pointBiserialEntry.answer_id as number;
          const pointBiserial: numberLike = (pointBiserialEntry.point_biserial as number) ?? defaultValue;
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
        answerSets: answerSets,
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
        point_biserials: point_biserials,
        full_credit: full_credit,
        correct: correct,
        incorrect: incorrect,
        partially_correct: partially_correct
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
