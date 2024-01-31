import express from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import log from "../utils/logger";
import {
  questionTypes,
  APIErrorResponse,
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasQuizQuestionGroup
} from "../../assets/types";
import { fetchCanvasUserInfo, fetchCanvasUserCourseData, fetchCanvasUserQuizData } from "../canvas_interact/canvas.api";
import { CanvasCourseQuizModel } from "../models/canvas.quiz.model";

const router = express.Router();

const canvasQuizQuestionSchema = z.object({
  canvasUserId: z.number().gte(0),
  canvasCourseInternalId: z.number().gte(0),
  quizId: z.number().gte(0),
  canvasMatchedLearningObjective: z.string().min(0),
  canvasQuizEntries: z.array(
    z.object({
      questionType: z.enum(questionTypes),
      questionText: z.string().min(0),
      answers: z.array(
        z.object({
          weight: z.number().gte(0).optional(),
          migration_id: z.string().min(0).optional(),
          id: z.number().gte(0).optional(),
          text: z.string().min(0).optional()
        })
      )
    })
  )
});

async function loadInitialCanvasDataFromExternalApiAndSaveIntoDB() {
  const canvasUserId = await fetchCanvasUserInfo();
  const canvasUserCourseIds = await fetchCanvasUserCourseData();
  const canvasQuizMap = await fetchCanvasUserQuizData(canvasUserCourseIds);
  const canvasQuizMapTransformedToArray = convertCanvasQuizMapToArray(canvasUserId, canvasQuizMap);

  // Insert into DB here
  log.info("LENGTH: " + canvasQuizMapTransformedToArray.length);
  canvasQuizMapTransformedToArray.forEach((currEntry) => {
    const validResult = canvasQuizQuestionSchema.safeParse(currEntry);
    if (validResult.success) {
      log.info("The following course objectives index is of the proper schema");
    } else {
      log.error(fromZodError(validResult.error));
      process.exit(1);
    }
  });

  for (let i = 0; i < canvasQuizMapTransformedToArray.length; i++) {
    try {
      const currEntry = canvasQuizMapTransformedToArray[i];

      // TODO: Check for existence of entry check (to avoid potential duplicates to be added)
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

function convertCanvasQuizMapToArray(userId: number, inputMap: Map<number, Array<CanvasQuizQuestionGroup>>) {
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
        const answers: CanvasCourseMCQAnswerMongoDBEntry[] = [];
        if (question.answers) {
          question.answers.forEach((answer) => {
            const newAnswer: CanvasCourseMCQAnswerMongoDBEntry = {
              weight: answer.weight,
              migration_id: answer.migration_id,
              id: answer.id,
              text: answer.text
            };
            answers.push(newAnswer);
          });
        }
        newQuizQuestionEntry.answers = answers;
        quizEntries.push(newQuizQuestionEntry);
      });
      const newQuizEntry: CanvasCourseQuizMongoDBEntry = {
        canvasUserId: userId,
        canvasCourseInternalId: courseId,
        quizId: quizId,
        canvasMatchedLearningObjective: "", // Empty for now: Will be resolved later in front-end React Matching Component
        canvasQuizEntries: quizEntries
      };
      resultArray.push(newQuizEntry);
    });
  });

  return resultArray;
}

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
    // TODO: Check for existence of entry check (to avoid potential duplicates to be added)
    log.info("Inserted the specified alien successfully! Congratulations!");
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
