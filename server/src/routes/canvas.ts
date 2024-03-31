import express from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import log from "../utils/logger";
import {
  QuestionTypeValues,
  APIErrorResponse,
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasQuizQuestionGroup,
  QuestionTypeEnumValues,
  CanvasCourseInfo,
  AxiosAuthHeaders,
  CanvasUserAssignmentWithRubricBase,
  CanvasCourseAssignmentRubricObjBase
} from "../shared/types";
import { fetchCanvasUserInfoRegUser, fetchCanvasUserInfoAdmin } from "../canvas_interact/canvas.api.shared";
import { fetchCanvasUserCourseData } from "../canvas_interact/canvas.api.course";
import { fetchCanvasUserQuizData } from "../canvas_interact/canvas.api.quiz";
import { CanvasCourseQuizModel } from "../models/canvas.quiz.model";
import { CanvasUserApiModel } from "../models/canvas.user.api.model";
import { getCanvasApiAuthHeaders } from "../utils/canvas.connection";
import {
  fetchCanvasUserAssignmentData,
  fetchCanvasUserAssignmentRubricData,
  fetchCanvasUserAssignmentSubmissionData
} from "../canvas_interact/canvas.api.assignment.rubric";
import { CanvasCourseAssignmentRubricObjModel } from "../models/canvas.assignment.rubric.model";

const router = express.Router();

const canvasQuizQuestionSchema = z.object({
  canvasUserId: z.number().gte(0),
  canvasCourseInternalId: z.number().gte(0),
  quizId: z.number().gte(0),
  canvasMatchedLearningObjectiveArr: z.array(z.array(z.string())).default([]),
  canvasQuizEntries: z
    .array(
      z.object({
        questionType: z.enum(QuestionTypeValues),
        questionText: z.string().min(1),
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

const canvasAssignmentRubricSchema = z.object({
  canvasUserId: z.number().gte(0),
  canvasDeptAbbrev: z.string().min(1),
  canvasCourseNum: z.number().gte(0),
  canvasCourseName: z.string().min(1),
  canvasCourseInternalId: z.number().gte(0),
  canvasRubricId: z.number().gte(0),
  canvasAssignmentId: z.number().gte(0),
  canvasAssignmentName: z.string().min(1),
  title: z.string().min(1),
  maxPoints: z.number().gte(0),
  data: z
    .array(
      z.object({
        id: z.string().min(1),
        maxCategoryPoints: z.number().gte(0),
        description: z.string().min(1),
        ratings: z
          .array(
            z.object({
              description: z.string().min(1),
              ratingPoints: z.number().gte(0)
            })
          )
          .default([])
      })
    )
    .default([]),
  canvasMatchedLearningObjectivesArr: z.array(z.array(z.string())).default([]),
  recentSubmissionData: z
    .array(
      z.object({
        canvasAssignmentScore: z.number().gte(0),
        rubricCategoryScores: z.array(
          z.object({
            id: z.string().min(1),
            points: z.number().gte(0).default(0)
          })
        )
      })
    )
    .default([])
    .optional()
});

async function loadCanvasDataFromExternalApiAndSaveIntoDB(canvasUserId: number) {
  const axiosHeaders = await getCanvasApiAuthHeaders(canvasUserId);
  const canvasUserCourseIds = await fetchCanvasUserCourseData(axiosHeaders);
  const canvasQuizMap = await fetchCanvasUserQuizData(axiosHeaders, canvasUserCourseIds);
  const canvasQuizMapTransformedToArray = convertCanvasQuizMapToArray(canvasUserId, canvasQuizMap);

  // Checks for valid Quiz schema creation
  log.info("QUIZ LENGTH: " + canvasQuizMapTransformedToArray.length);
  canvasQuizMapTransformedToArray.forEach((currEntry, idx) => {
    const validResult = canvasQuizQuestionSchema.safeParse(currEntry);
    if (validResult.success) {
      log.info(`The following quiz question object array (at index ${idx}) is of the proper schema`);
    } else {
      log.error(fromZodError(validResult.error));
      process.exit(1);
    }
  });

  for (let i = 0; i < canvasQuizMapTransformedToArray.length; i++) {
    log.info(`QUIZ INDEX ${i} STARTED ------------------------------------- \n`);
    try {
      const currEntry = canvasQuizMapTransformedToArray[i];

      // Avoid adding quiz entries that have no questions to the frontend
      if (currEntry.canvasQuizEntries.length === 0) {
        log.warn("Did NOT insert...entry does not have any questions in it");
        continue;
      }

      const canvasQuizItemToInsert = new CanvasCourseQuizModel(currEntry);

      // Delete "older" Canvas quiz entries (if they exist)
      const olderCanvasQuizItemToDelete = await CanvasCourseQuizModel.findOne({
        canvasUserId: canvasQuizItemToInsert.canvasUserId,
        quizId: canvasQuizItemToInsert.quizId
      });
      if (olderCanvasQuizItemToDelete) {
        log.warn(
          `Older Canvas quiz entry with index ${i} detected...deleting older one and inserting new one into MongoDB database...`
        );

        // Save the old learning objectives to new/updated set of questions
        canvasQuizItemToInsert.canvasMatchedLearningObjectivesArr = [
          ...olderCanvasQuizItemToDelete.canvasMatchedLearningObjectivesArr
        ];

        // Delete the older quiz entry from MongoDB database
        const deleteOlderCanvasQuizItemResult = await CanvasCourseQuizModel.findOneAndDelete({
          canvasUserId: canvasQuizItemToInsert.canvasUserId,
          quizId: canvasQuizItemToInsert.quizId
        });
        console.assert(deleteOlderCanvasQuizItemResult, "Error! The older quiz item did not get deleted properly!");
      }

      const canvasQuizItemInsertResult = await canvasQuizItemToInsert.save();
      log.info("Inserted the specified quiz entry successfully! Congratulations!");
    } catch (err) {
      log.error("Error with interacting the Canvas API! Please try again!");
      process.exit(1);
    }
    log.info(`QUIZ INDEX ${i} COMPLETED ------------------------------------- \n`);
  }
  log.info("Inserted ALL of the specified quiz entries successfully! Congratulations!");

  const assignmentRubricResultsArr = await fetchCanvasUserAssignmentData(
    canvasUserId,
    axiosHeaders,
    canvasUserCourseIds
  );
  await fetchCanvasUserAssignmentRubricData(axiosHeaders, assignmentRubricResultsArr);
  await fetchCanvasUserAssignmentSubmissionData(axiosHeaders, assignmentRubricResultsArr);
  const parsedAssignmentRubricResultsArr =
    convertAssignmentWithRubricArrToBeMongoDBCompliant(assignmentRubricResultsArr);

  // Checks for valid Assignment with Rubric schema creation
  log.info("ASSIGNMENTS WITH RUBRICS LENGTH: " + parsedAssignmentRubricResultsArr.length);
  parsedAssignmentRubricResultsArr.forEach((currEntry, idx) => {
    const validResult = canvasAssignmentRubricSchema.safeParse(currEntry);
    if (validResult.success) {
      log.info(`The following assignment with rubric object array (at index ${idx}) is of the proper schema`);
    } else {
      // log.warn(currEntry.recentSubmissionData);
      log.warn(idx);
      log.warn(currEntry.canvasRubricId);
      log.error(fromZodError(validResult.error));
      process.exit(1);
    }
  });

  for (let j = 0; j < parsedAssignmentRubricResultsArr.length; j++) {
    log.info(`ASSIGNMENT WITH RUBRIC INDEX ${j} STARTED ------------------------------------- \n`);
    try {
      const currEntry = parsedAssignmentRubricResultsArr[j];

      const canvasAssignmentRubricItemToInsert = new CanvasCourseAssignmentRubricObjModel(currEntry);

      // Delete "older" Canvas assignment with rubric entries (if they exist)
      const olderCanvasAssignmentRubricItemToDelete = await CanvasCourseAssignmentRubricObjModel.findOne({
        canvasUserId: canvasAssignmentRubricItemToInsert.canvasUserId,
        canvasCourseInternalId: canvasAssignmentRubricItemToInsert.canvasCourseInternalId,
        canvasRubricId: canvasAssignmentRubricItemToInsert.canvasRubricId
      });
      if (olderCanvasAssignmentRubricItemToDelete) {
        log.warn(
          `Older Canvas assignment with rubric entry with index ${j} detected...deleting older one and inserting new one into MongoDB database...`
        );

        // Save the old learning objectives to new/updated set of assignment rubrics
        canvasAssignmentRubricItemToInsert.canvasMatchedLearningObjectivesArr = [
          ...olderCanvasAssignmentRubricItemToDelete.canvasMatchedLearningObjectivesArr
        ];

        // Delete the older assignment rubric entry from MongoDB database
        const deleteOlderCanvasAssignmentRubricItemResult = await CanvasCourseAssignmentRubricObjModel.findOneAndDelete(
          {
            canvasUserId: canvasAssignmentRubricItemToInsert.canvasUserId,
            canvasCourseInternalId: canvasAssignmentRubricItemToInsert.canvasCourseInternalId,
            canvasRubricId: canvasAssignmentRubricItemToInsert.canvasRubricId
          }
        );
        console.assert(
          deleteOlderCanvasAssignmentRubricItemResult,
          "Error! The older assignment with rubric item did not get deleted properly!"
        );
      }

      const canvasAssignmentRubricItemInsertResult = await canvasAssignmentRubricItemToInsert.save();
      log.info("Inserted the specified assignment with rubric entry successfully! Congratulations!");
    } catch (err) {
      log.error((err as Error).stack);
      log.error("Error with interacting the Canvas API! Please try again!");
      process.exit(1);
    }
    log.info(`ASSIGNMENT WITH RUBRIC INDEX ${j} COMPLETED ------------------------------------- \n`);
  }
  log.info("Inserted ALL of the specified assignment with rubric entries successfully! Congratulations!");

  return true;
}

function convertCanvasQuizMapToArray(userId: number, inputMap: Map<CanvasCourseInfo, Array<CanvasQuizQuestionGroup>>) {
  const resultArray: CanvasCourseQuizMongoDBEntry[] = [];

  // Map: { { courseId, courseName, courseDept, courseNum }, Array <{ quizId, questioNames, [questions, [answers (optional)]] } }
  inputMap.forEach((questionGroups, { courseId, courseName, courseDept, courseNum }) => {
    questionGroups.forEach(({ quizId, quizName, questions }) => {
      const quizEntries: CanvasCourseQuizQuestionMongoDBEntry[] = [];
      questions.forEach((question) => {
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
        newQuizQuestionEntry.answers = [...answers];
        quizEntries.push(newQuizQuestionEntry);
      });
      const newQuizEntry: CanvasCourseQuizMongoDBEntry = {
        canvasUserId: userId,
        canvasCourseInternalId: courseId,
        canvasCourseName: courseName,
        canvasCourseDept: courseDept,
        canvasCourseNum: courseNum,
        quizId: quizId,
        quizName: quizName,
        // Empty for now: Will be resolved later in front-end React Matching Component
        canvasMatchedLearningObjectivesArr: new Array<string[]>(quizEntries.length).fill([]) as string[][],
        canvasQuizEntries: quizEntries
      };
      resultArray.push(newQuizEntry);
    });
  });

  return resultArray;
}

function convertAssignmentWithRubricArrToBeMongoDBCompliant(
  assignmentRubricResultsArr: CanvasUserAssignmentWithRubricBase[]
): CanvasCourseAssignmentRubricObjBase[] {
  const newAssignmentRubricResultsArr: CanvasCourseAssignmentRubricObjBase[] = [];

  assignmentRubricResultsArr.forEach((assignmentRubricResult) => {
    console.assert(assignmentRubricResult.canvasCourseAssignmentRubricObjArr.length === 1);
    const assignmentRubricObjArrEntry = { ...assignmentRubricResult.canvasCourseAssignmentRubricObjArr[0] };

    const newAssignmentRubricResult: CanvasCourseAssignmentRubricObjBase = {
      canvasUserId: assignmentRubricResult.canvasUserId,
      canvasCourseInternalId: assignmentRubricResult.canvasCourseInternalId,
      canvasDeptAbbrev: assignmentRubricResult.canvasDeptAbbrev,
      canvasCourseNum: assignmentRubricResult.canvasCourseNum,
      canvasCourseName: assignmentRubricResult.canvasCourseName,
      canvasRubricId: assignmentRubricResult.canvasCourseAssignmentRubricId,
      canvasAssignmentId: assignmentRubricResult.canvasCourseAssignmentId,
      canvasAssignmentName: assignmentRubricResult.canvasCourseAssignmentName,
      title: assignmentRubricObjArrEntry.title,
      maxPoints: assignmentRubricObjArrEntry.maxPoints,
      rubricData: assignmentRubricObjArrEntry.rubricData,
      canvasMatchedLearningObjectivesArr: new Array(assignmentRubricObjArrEntry.rubricData.length).fill(
        []
      ) as string[][],
      recentSubmissionData: assignmentRubricResult.canvasCourseAssignmentRubricSubmissionArr
    };
    newAssignmentRubricResultsArr.push(newAssignmentRubricResult);
  });

  return newAssignmentRubricResultsArr;
}

router.put("/api/canvas/retrieveCanvasId/:canvasAccountId/:canvasUsername", async (req, res) => {
  const canvasAccountId = parseInt(req.params.canvasAccountId);
  const canvasUsername = req.params.canvasUsername as string;
  log.info(req.body);
  const { canvasUserApiKey } = req.body;
  log.info("Canvas Account ID:", canvasAccountId);
  log.info("Canvas Username:", canvasUsername);
  log.info("Canvas User API Key:", canvasUserApiKey);
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
    log.info("FINAL USER ID: ", canvasUserId);
    const canvasUserInfoEntryToInsert = new CanvasUserApiModel({
      canvasUserId: canvasUserId,
      canvasUserApiKey: canvasUserApiKey as string,
      canvasUsername: canvasUsername
    });

    const canvasUserInfoEntryFindResult = await CanvasUserApiModel.findOne({ canvasUserId: canvasUserId });
    const isNewUser = !canvasUserInfoEntryFindResult;
    if (isNewUser) {
      const canvasUserInfoEntryInsertResult = await canvasUserInfoEntryToInsert.save();
      log.info("Inserted the specified user information successfully! Congratulations!");
    } else {
      canvasUserInfoEntryFindResult.canvasUsername = canvasUsername;
      canvasUserInfoEntryFindResult.canvasUserApiKey = canvasUserApiKey;
      const canvasQuizEntryUpdateResult = await canvasUserInfoEntryFindResult.save();
      log.info("Updated the specified Canvas user information successfully! Congratulations!");
    }
    await loadCanvasDataFromExternalApiAndSaveIntoDB(canvasUserId);
    return res.status(isNewUser ? 201 : 200).send(JSON.stringify({ UserId: canvasUserId })); // 201 = Successful Resource Creation
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

router.put("/api/canvas/quiz/update_objectives/:canvasQuizEntryId", async (req, res) => {
  const canvasQuizEntryToUpdateId = req.params.canvasQuizEntryId;

  const learningObjectiveArrToUpdate = req.body as string[][];

  try {
    const canvasQuizEntryToUpdate = await CanvasCourseQuizModel.findById(canvasQuizEntryToUpdateId);
    // Error check to avoid working with an invalid MongoDB "_id" passed to the database query
    if (!canvasQuizEntryToUpdate) {
      throw new Error("The specified Canvas quiz questions do not exist in the MongoDB database");
    }
    canvasQuizEntryToUpdate.canvasMatchedLearningObjectivesArr = [...learningObjectiveArrToUpdate];
    const canvasQuizEntryUpdateResult = await canvasQuizEntryToUpdate.save();
    log.info(
      "Updated the specified Canvas quiz questions successfully with the following learning objectives! Congratulations!"
    );
    return res.status(200).json(canvasQuizEntryUpdateResult);
  } catch (err) {
    log.error("Could not update the specified Canvas quiz questions! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "PUT",
      errorMsg: "Failed to update the MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

router.put("/api/canvas/assignment_rubric/update_objectives/:canvasAssignmentRubricEntryId", async (req, res) => {
  const canvasAssignmentRubricEntryToUpdateId = req.params.canvasAssignmentRubricEntryId;

  const learningObjectiveArrToUpdate = req.body as string[][];

  try {
    const canvasCourseAssignmentRubricObjEntryToUpdate = await CanvasCourseAssignmentRubricObjModel.findById(
      canvasAssignmentRubricEntryToUpdateId
    );
    // Error check to avoid working with an invalid MongoDB "_id" passed to the database query
    if (!canvasCourseAssignmentRubricObjEntryToUpdate) {
      throw new Error("The specified Canvas assignment (with rubric) does not exist in the MongoDB database");
    }
    canvasCourseAssignmentRubricObjEntryToUpdate.canvasMatchedLearningObjectivesArr = [...learningObjectiveArrToUpdate];
    const canvasCourseAssignmentRubricObjEntryUpdateResult = await canvasCourseAssignmentRubricObjEntryToUpdate.save();
    log.info(
      "Updated the specified Canvas assignment (with rubric) successfully with the following learning objectives! Congratulations!"
    );
    return res.status(200).json(canvasCourseAssignmentRubricObjEntryUpdateResult);
  } catch (err) {
    log.error("Could not update the specified Canvas assignment (with rubric)! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "PUT",
      errorMsg: "Failed to update the MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

export { router as canvasDataRouter, loadCanvasDataFromExternalApiAndSaveIntoDB };
