import express from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import log from "../utils/logger";
import {
  MongoDBItem,
  QuestionTypeValues,
  APIErrorResponse,
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasQuizQuestionGroup,
  QuestionTypeEnumValues,
  CanvasCourseInfo
} from "../../assets/types";
import { fetchCanvasUserInfo, fetchCanvasUserCourseData, fetchCanvasUserQuizData } from "../canvas_interact/canvas.api";
import { CanvasCourseQuizModel } from "../models/canvas.quiz.model";

const router = express.Router();

const canvasQuizQuestionSchema = z.object({
  canvasUserId: z.number().gte(0),
  canvasCourseInternalId: z.number().gte(0),
  quizId: z.number().gte(0),
  canvasMatchedLearningObjectiveArr: z.array(z.string()).default([]),
  canvasQuizEntries: z
    .array(
      z.object({
        questionType: z.enum(QuestionTypeValues),
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
    .default([])
});

async function loadInitialCanvasDataFromExternalApiAndSaveIntoDB() {
  const canvasUserId = await fetchCanvasUserInfo();
  const canvasUserCourseIds = await fetchCanvasUserCourseData();
  const canvasQuizMap = await fetchCanvasUserQuizData(canvasUserCourseIds);
  const canvasQuizMapTransformedToArray = convertCanvasQuizMapToArray(canvasUserId, canvasQuizMap);

  // Checks for valid schema creation
  log.info("LENGTH: " + canvasQuizMapTransformedToArray.length);
  canvasQuizMapTransformedToArray.forEach((currEntry, idx) => {
    const validResult = canvasQuizQuestionSchema.safeParse(currEntry);
    if (validResult.success) {
      log.info(`The following quiz question object array (at index ${idx}) is of the proper schema`);
    } else {
      log.error(fromZodError(validResult.error));
      process.exit(1);
    }
  });

  log.info(canvasQuizMapTransformedToArray.length);
  for (let i = 0; i < canvasQuizMapTransformedToArray.length; i++) {
    log.info(`INDEX ${i} STARTED ------------------------------------- \n`);
    try {
      const currEntry = canvasQuizMapTransformedToArray[i];

      // Avoid adding quiz entries that have no questions to the frontend
      if (currEntry.canvasQuizEntries.length === 0) {
        log.warn("Did NOT insert...entry does not have any questions in it");
        continue;
      }

      const canvasQuizItemToInsert = new CanvasCourseQuizModel(currEntry);
      // Check for existence of entry check (to avoid potential duplicates to be added)
      const newEntryFound = await checkCanvasQuizQuestionExistence(canvasQuizItemToInsert);
      if (!newEntryFound) {
        log.error("Did NOT insert...something already matches this");
        continue;
      }
      const canvasQuizItemInsertResult = await canvasQuizItemToInsert.save();
      log.info("Inserted the specified course objectives successfully! Congratulations!");
    } catch (err) {
      log.error("Error with interacting the Canvas API! Please try again!");
      process.exit(1);
    }
    log.info(`INDEX ${i} COMPLETED ------------------------------------- \n`);
  }
  log.info("Inserted ALL of the specified course objectives successfully! Congratulations!");

  return true;
}

function convertCanvasQuizMapToArray(userId: number, inputMap: Map<CanvasCourseInfo, Array<CanvasQuizQuestionGroup>>) {
  const resultArray: CanvasCourseQuizMongoDBEntry[] = [];

  // Map: { courseId, Array <{ quizId, questions, [questions, [answers (optional)]] } }
  inputMap.forEach((questionGroups, { courseId, courseName }) => {
    questionGroups.forEach((questionGroup) => {
      const quizEntries: CanvasCourseQuizQuestionMongoDBEntry[] = [];
      const { quizId, quizName } = questionGroup;
      const canvasMatchedLearningObjectivesArr: string[] = [];
      questionGroup.questions.forEach((question) => {
        const newQuizQuestionEntry: CanvasCourseQuizQuestionMongoDBEntry = {
          questionType: question.question_type! as QuestionTypeEnumValues,
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
        canvasMatchedLearningObjectivesArr.push("");
      });
      const newQuizEntry: CanvasCourseQuizMongoDBEntry = {
        canvasUserId: userId,
        canvasCourseInternalId: courseId,
        canvasCourseName: courseName,
        quizId: quizId,
        quizName: quizName,
        canvasMatchedLearningObjectivesArr: canvasMatchedLearningObjectivesArr, // Empty for now: Will be resolved later in front-end React Matching Component
        canvasQuizEntries: quizEntries
      };
      resultArray.push(newQuizEntry);
    });
  });

  return resultArray;
}

async function checkCanvasQuizQuestionExistence(currEntry: MongoDBItem<CanvasCourseQuizMongoDBEntry>) {
  let newEntryFound = false;

  for (let i = 0; i < currEntry.canvasQuizEntries.length; i++) {
    if (currEntry.canvasQuizEntries[i].answers !== undefined && currEntry.canvasQuizEntries[i].answers!.length > 0) {
      for (let j = 0; j < currEntry.canvasQuizEntries[i].answers!.length; j++) {
        const findObjWithAnswers = {
          canvasUserId: currEntry.canvasUserId,
          canvasCourseInternalId: currEntry.canvasCourseInternalId,
          canvasCourseName: currEntry.canvasCourseName,
          quizId: currEntry.quizId,
          quizName: currEntry.quizName,
          canvasQuizEntries: {
            $elemMatch: {
              questionType: currEntry.canvasQuizEntries[i].questionType,
              questionText: currEntry.canvasQuizEntries[i].questionText,
              answers: {
                $elemMatch: {
                  weight: currEntry.canvasQuizEntries[i].answers![j].weight,
                  migration_id: currEntry.canvasQuizEntries[i].answers![j].migration_id,
                  id: currEntry.canvasQuizEntries[i].answers![j].id,
                  text: currEntry.canvasQuizEntries[i].answers![j].text
                }
              }
            }
          }
        };
        const findResult = await CanvasCourseQuizModel.find<CanvasCourseQuizMongoDBEntry>(findObjWithAnswers);
        // A new (unique) entry (or an update to an existing entry) exists (no need to further check this object to insert/update)
        if (findResult.length === 0) {
          log.info("[WITHOUT ANSWERS] Did not find this entry in the MongoDB database...considered new!");
          return true;
        }
      }
    } else {
      const findObjWithoutAnswers = {
        canvasUserId: currEntry.canvasUserId,
        canvasCourseInternalId: currEntry.canvasCourseInternalId,
        canvasCourseName: currEntry.canvasCourseName,
        quizId: currEntry.quizId,
        quizName: currEntry.quizName,
        canvasQuizEntries: {
          $elemMatch: {
            questionType: currEntry.canvasQuizEntries[i].questionType,
            questionText: currEntry.canvasQuizEntries[i].questionText
          }
        }
      };
      const findResult = await CanvasCourseQuizModel.find<CanvasCourseQuizMongoDBEntry>(findObjWithoutAnswers);
      // A new (unique) entry (or an update to an existing entry) exists (no need to further check this object to insert/update)
      if (findResult.length === 0) {
        log.warn("[WITH ANSWERS] Did not find this entry in the MongoDB database...considered new!");
        return true;
      }
    }
  }
  return newEntryFound;
}

let index = 0;
router.get("/api/canvas", async (_, res) => {
  try {
    const currItems = await CanvasCourseQuizModel.find();
    log.info(currItems);
    index++;
    log.info(`END OF GET REQUEST #${index} ---------------------`);
    return res.status(200).json(currItems);
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
