import express from "express";
import log from "../utils/logger";
import {
  APIErrorResponse,
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasQuizQuestionGroup
} from "../../assets/types";
import { fetchCanvasUserCourseData, fetchCanvasUserQuizData, checkQuizMapHelper } from "../canvas_interact/canvas.api";
import { mapReplacer } from "../utils/json.helper";

const router = express.Router();

let index = 0;
router.get("/api/canvas/external_canvas_api", async (_, res) => {
  try {
    const canvasUserCourseIds = await fetchCanvasUserCourseData();
    const canvasQuizMap = await fetchCanvasUserQuizData(canvasUserCourseIds);
    // checkQuizMapHelper(canvasQuizMap);
    const canvasQuizMapTransformedToArray = convertCanvasQuizMapToArray(canvasQuizMap);
    log.info(canvasQuizMapTransformedToArray);
    index++;
    log.info(`END OF GET REQUEST #${index} ------------------------`);
    // return res.status(200).send(JSON.stringify(canvasQuizMap, mapReplacer, 2));
    return res.status(200).send(JSON.stringify(canvasQuizMapTransformedToArray, null, 2));
  } catch (err) {
    log.error("Error with interacting the Canvas API! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "Error with interacting the Canvas API"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

function convertCanvasQuizMapToArray(inputMap: Map<number, Array<CanvasQuizQuestionGroup>>) {
  const resultArray: CanvasCourseQuizMongoDBEntry[] = [];

  // Map: { courseId, Array <{ quizId, [questions, [answers (optional)]] } }
  inputMap.forEach((questionGroups, courseId) => {
    questionGroups.forEach((questionGroup) => {
      const quizEntries: CanvasCourseQuizQuestionMongoDBEntry[] = [];
      const { quizId } = questionGroup;
      questionGroup.questions.forEach((question) => {
        const newQuizQuestionEntry: CanvasCourseQuizQuestionMongoDBEntry = {
          questionType: question.question_type! as
            | "multiple_choice_question"
            | "essay_question"
            | "true_false_question"
            | "multiple_dropdrowns_question"
            | "fill_in_multiple_blanks_question"
            | "multiple_answers_question"
            | "short_answer_question"
            | "numerical_question",
          questionText: question.question_text!
        };
        if (question.answers) {
          const answers: CanvasCourseMCQAnswerMongoDBEntry[] = [];
          question.answers.forEach((answer) => {
            const newAnswer: CanvasCourseMCQAnswerMongoDBEntry = {
              weight: answer.weight,
              migration_id: answer.migration_id,
              id: answer.id,
              text: answer.text
            };
            answers.push(newAnswer);
          });
          newQuizQuestionEntry.answers = answers;
        }
        quizEntries.push(newQuizQuestionEntry);
      });
      const newQuizEntry: CanvasCourseQuizMongoDBEntry = {
        courseId: courseId,
        quizId: quizId,
        canvasQuizEntries: quizEntries
      };
      resultArray.push(newQuizEntry);
    });
  });

  return resultArray;
}

router.post("/api/canvas", async (req, res) => {
  
});
export { router as canvasDataRouter };
