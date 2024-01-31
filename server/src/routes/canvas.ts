import express from "express";
import log from "../utils/logger";
import {
  APIErrorResponse,
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasQuizQuestionGroup
} from "../../assets/types";
import { fetchCanvasUserCourseData, fetchCanvasUserQuizData } from "../canvas_interact/canvas.api";
import { CanvasCourseQuizModel } from "../models/canvas.quiz.model";
// import { mapReplacer } from "../utils/json.helper";

const router = express.Router();

async function loadInitialCanvasDataFromExternalApiAndSaveIntoDB() {
  const canvasUserCourseIds = await fetchCanvasUserCourseData();
  const canvasQuizMap = await fetchCanvasUserQuizData(canvasUserCourseIds);
  const canvasQuizMapTransformedToArray = convertCanvasQuizMapToArray(canvasQuizMap);

  // Insert into DB here
  log.info("LENGTH: " + canvasQuizMapTransformedToArray.length);
  for (let i = 0; i < canvasQuizMapTransformedToArray.length; i++) {
    try {
      const currEntry = canvasQuizMapTransformedToArray[i];

      const canvasQuizItemToInsert = new CanvasCourseQuizModel(currEntry);
      const canvasQuizItemInsertResult = canvasQuizItemToInsert.save();
      log.info("Inserted the specified course objectives successfully! Congratulations!");
    } catch (err) {
      log.error("Error with interacting the Canvas API! Please try again!");
      process.exit(1);
    }
    log.info(`INDEX ${i} COMPLETED ------------------------------------- \n`);
  }

  return true;
}

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
            | "multiple_dropdowns_question"
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

router.get("/api/canvas/external_canvas_api", async (_, res) => {
  const canvasUserCourseIds = await fetchCanvasUserCourseData();
  const canvasQuizMap = await fetchCanvasUserQuizData(canvasUserCourseIds);
  const canvasQuizMapTransformedToArray = convertCanvasQuizMapToArray(canvasQuizMap);
  return res.status(200).send(JSON.stringify(canvasQuizMapTransformedToArray, null, 2));
});

let index = 0;
router.get("/api/canvas", async (_, res) => {
  try {
    index++;
    log.info(`END OF GET REQUEST #${index} ------------------------`);
    return res.status(200);
  } catch (err) {
    log.error("Did not find any Canvas quiz question for any course! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "No items found in MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

router.post("/api/canvas", async (req, res) => {
  try {
    return res.status(201); // 201 = Successful Resource Creation
  } catch (err) {
    log.error("Could not insert the specified Canvas quiz questions! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "POST",
      errorMsg: "Failed to insert into the MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as canvasDataRouter, loadInitialCanvasDataFromExternalApiAndSaveIntoDB };
