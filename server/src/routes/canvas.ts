import express from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import axios from "axios";
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
  CanvasCourseInfo,
  CanvasQuiz,
  AxiosAuthHeaders
} from "../../assets/types";
import {
  fetchCanvasUserInfoRegUser,
  fetchCanvasUserInfoAdmin,
  fetchCanvasUserCourseData,
  fetchCanvasUserQuizData
} from "../canvas_interact/canvas.api";
import { CanvasCourseQuizModel } from "../models/canvas.quiz.model";
import { CanvasUserApiModel } from "../models/canvas.user.api";
import { getCanvasApiAuthHeaders } from "../utils/canvas.connection";

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

async function loadCanvasDataFromExternalApiAndSaveIntoDB(canvasUserId: number) {
  const axiosHeaders = await getCanvasApiAuthHeaders(canvasUserId);
  const canvasUserCourseIds = await fetchCanvasUserCourseData(axiosHeaders);
  const canvasQuizMap = await fetchCanvasUserQuizData(axiosHeaders, canvasUserCourseIds);
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

  // Map: { { courseId, courseName, courseDept, courseNum }, Array <{ quizId, questioNames, [questions, [answers (optional)]] } }
  inputMap.forEach((questionGroups, { courseId, courseName, courseDept, courseNum }) => {
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
        canvasCourseDept: courseDept,
        canvasCourseNum: courseNum,
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
  return false;
}

router.put("/api/canvas/retrieveCanvasId/:canvasAccountId/:canvasUsername", async (req, res) => {
  const canvasAccountId = parseInt(req.params.canvasAccountId);
  const canvasUsername = req.params.canvasUsername as string;
  console.log(req.body);
  const { canvasUserApiKey } = req.body;
  console.log("Canvas Account ID:", canvasAccountId);
  console.log("Canvas Username:", canvasUsername);
  console.log("Canvas User API Key:", canvasUserApiKey);
  try {
    const axiosHeaders: AxiosAuthHeaders = {
      Authorization: `Bearer ${canvasUserApiKey}`
    };

    // Canvas API O-Auth Fallback
    // Instructors (and above can only use this)
    let canvasUserId = await fetchCanvasUserInfoAdmin(axiosHeaders, canvasAccountId, canvasUsername);
    // Students can use this
    if (canvasUserId === -1) {
      canvasUserId = await fetchCanvasUserInfoRegUser(axiosHeaders);
      if (canvasUserId === -1) {
        throw new Error("Error in storing Canvas user information in MongoDB database");
      }
    }
    console.assert(canvasUserId !== -1);
    console.log("FINAL USER ID: ", canvasUserId);
    const canvasUserInfoEntryToInsert = new CanvasUserApiModel({
      canvasUserId: canvasUserId,
      canvasUserApiKey: canvasUserApiKey,
      canvasUsername: canvasUsername
    });

    const canvasUserInfoEntryFindResult = await CanvasUserApiModel.findOne({ canvasUserId: canvasUserId });
    if (!canvasUserInfoEntryFindResult) {
      const canvasUserInfoEntryInsertResult = await canvasUserInfoEntryToInsert.save();
      log.info("Inserted the specified user information successfully! Congratulations!");
      await loadCanvasDataFromExternalApiAndSaveIntoDB(canvasUserId);
      return res.status(201).send(JSON.stringify({ UserId: canvasUserId })); // 201 = Successful Resource Creation
    } else {
      canvasUserInfoEntryFindResult.canvasUsername = canvasUsername;
      canvasUserInfoEntryFindResult.canvasUserApiKey = canvasUserApiKey;
      const canvasQuizEntryUpdateResult = await canvasUserInfoEntryFindResult.save();
      await loadCanvasDataFromExternalApiAndSaveIntoDB(canvasUserId);
      log.info("Updated the specified Canvas user information successfully! Congratulations!");
      return res.status(200).send(JSON.stringify({ UserId: canvasUserId }));
    }
  } catch (err) {
    log.error("Error in storing Canvas user information in MongoDB database! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "PUT",
      errorMsg: "Failed to store Canvas user information the MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

let index = 0;
router.get("/api/canvas/:canvasUserId", async (req, res) => {
  try {
    const canvasUserId = parseInt(req.params.canvasUserId);
    log.warn(`Quiz Info Requested Canvas User ID: ${canvasUserId}`);
    const currItems = await CanvasCourseQuizModel.find({ canvasUserId: canvasUserId });
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

router.put("/api/canvas/update_objectives/:canvasQuizEntryId", async (req, res) => {
  const canvasQuizEntryToUpdateId = req.params.canvasQuizEntryId;

  const learningObjectiveArrToUpdate = req.body as string[];

  try {
    const canvasQuizEntryToUpdate = await CanvasCourseQuizModel.findById(canvasQuizEntryToUpdateId);
    // Error check to avoid working with an invalid MongoDB "_id" passed to the database query
    if (!canvasQuizEntryToUpdate) {
      throw new Error("The specified Canvas quiz question does not exist in the MongoDB database");
    }
    canvasQuizEntryToUpdate.canvasMatchedLearningObjectivesArr = learningObjectiveArrToUpdate;
    const canvasQuizEntryUpdateResult = await canvasQuizEntryToUpdate.save();
    log.info("Updated the specified Canvas quiz question successfully! Congratulations!");
    return res.status(200).json(canvasQuizEntryUpdateResult);
  } catch (err) {
    log.error("Could not update the specified Canvas quiz question! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "PUT",
      errorMsg: "Failed to update the MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as canvasDataRouter, loadCanvasDataFromExternalApiAndSaveIntoDB };
