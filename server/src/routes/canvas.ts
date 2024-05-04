import express from "express";
import { fromZodError } from "zod-validation-error";
import { EventEmitter } from "events";
import log from "../utils/logger";
import {
  APIErrorResponse,
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasQuizQuestionGroup,
  QuestionTypeEnumValues,
  CanvasCourseInfo,
  AxiosAuthHeaders,
  CanvasUserAssignmentWithRubricBase,
  CanvasCourseAssignmentRubricObjBase,
  SeasonTypeEnumValues
} from "../shared/types";
import { canvasQuizQuestionSchema, canvasAssignmentRubricSchema } from "../shared/canvas.zod.schemas";
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
import { CourseObjectivesModel } from "../models/canvas.objectives.model";

const router = express.Router();
const userLoginProgressEmitter = new EventEmitter();
const userDashboardProgressEmitter = new EventEmitter();

async function loadCanvasDataFromExternalApiAndSaveIntoDB(
  canvasUserId: number,
  academicYear: number,
  academicSemester: SeasonTypeEnumValues
) {
  const axiosHeaders = await getCanvasApiAuthHeaders(canvasUserId);
  const academicYearAndSemesterFilterStr = `${academicYear} ${academicSemester}` as const;
  userDashboardProgressEmitter.emit("progress", {
    progress: `[${academicYearAndSemesterFilterStr}] Pulling Canvas User's Enrolled Course Data`
  });
  const canvasUserCourseIds = await fetchCanvasUserCourseData(axiosHeaders, academicYearAndSemesterFilterStr);

  userDashboardProgressEmitter.emit("progress", {
    progress: `[${academicYearAndSemesterFilterStr}] Pulling Canvas User's Quiz Entries from External API`
  });
  const canvasQuizMap = await fetchCanvasUserQuizData(
    axiosHeaders,
    canvasUserCourseIds,
    academicSemester,
    academicYear
  );
  const canvasQuizMapTransformedToArray = convertCanvasQuizMapToArray(canvasUserId, canvasQuizMap);

  // Checks for valid Quiz schema creation
  log.info("QUIZ LENGTH: " + canvasQuizMapTransformedToArray.length);
  canvasQuizMapTransformedToArray.forEach((currEntry, idx) => {
    console.log(currEntry);
    const validResult = canvasQuizQuestionSchema.safeParse(currEntry);
    if (validResult.success) {
      userDashboardProgressEmitter.emit("progress", {
        progress: `[${academicYearAndSemesterFilterStr}] The following quiz question object array (at index ${idx}) is of the proper schema`
      });
      log.info(`The following quiz question object array (at index ${idx}) is of the proper schema`);
    } else {
      log.error(fromZodError(validResult.error));
      process.exit(1);
    }
  });

  userDashboardProgressEmitter.emit("progress", {
    progress: `[${academicYearAndSemesterFilterStr}] Inserting/Updating Canvas User's Quiz Entries in MongoDB`
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
        quizId: canvasQuizItemToInsert.quizId,
        canvasCourseAcademicSemesterOffered: canvasQuizItemToInsert.canvasCourseAcademicSemesterOffered,
        canvasCourseAcademicYearOffered: canvasQuizItemToInsert.canvasCourseAcademicYearOffered
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
          quizId: canvasQuizItemToInsert.quizId,
          canvasCourseAcademicSemesterOffered: canvasQuizItemToInsert.canvasCourseAcademicSemesterOffered,
          canvasCourseAcademicYearOffered: canvasQuizItemToInsert.canvasCourseAcademicYearOffered
        });
        console.assert(deleteOlderCanvasQuizItemResult, "Error! The older quiz item did not get deleted properly!");
      }

      const canvasQuizItemInsertResult = await canvasQuizItemToInsert.save();
      log.info("Inserted the specified quiz entry successfully! Congratulations!");
      userDashboardProgressEmitter.emit("progress", {
        progress: `[${academicYearAndSemesterFilterStr}] Inserted the specified quiz entry successfully! Congratulations!`
      });
    } catch (err) {
      log.error("Error with the specified quiz entry and interacting the Canvas API! Please try again!");
      userDashboardProgressEmitter.emit("progress", {
        progress: `[${academicYearAndSemesterFilterStr}] Error with the specified quiz entry and interacting the Canvas API! Please try again!`
      });
      process.exit(1);
    }
    log.info(`QUIZ INDEX ${i} COMPLETED ------------------------------------- \n`);
    userDashboardProgressEmitter.emit("progress", {
      progress: `[${academicYearAndSemesterFilterStr}] QUIZ INDEX ${i} COMPLETED ------------------------------------- \n`
    });
  }
  log.info("Inserted ALL of the specified quiz entries successfully! Congratulations!");
  userDashboardProgressEmitter.emit("progress", {
    progress: `[${academicYearAndSemesterFilterStr}] Inserted ALL of the specified quiz entries successfully! Congratulations!`
  });

  userDashboardProgressEmitter.emit("progress", {
    progress: `[${academicYearAndSemesterFilterStr}] Pulling Canvas User's Assignment (with Rubric) Entries from External API`
  });
  const assignmentRubricResultsArr = await fetchCanvasUserAssignmentData(
    axiosHeaders,
    canvasUserCourseIds,
    academicSemester,
    academicYear
  );
  await fetchCanvasUserAssignmentRubricData(axiosHeaders, assignmentRubricResultsArr);
  await fetchCanvasUserAssignmentSubmissionData(axiosHeaders, assignmentRubricResultsArr);
  const parsedAssignmentRubricResultsArr = convertAssignmentWithRubricArrToBeMongoDBCompliant(
    canvasUserId,
    assignmentRubricResultsArr
  );

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

  userDashboardProgressEmitter.emit("progress", {
    progress: "Inserting/Updating Canvas User's Assignment (with Rubric) Entries in MongoDB"
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
        canvasRubricId: canvasAssignmentRubricItemToInsert.canvasRubricId,
        canvasCourseAcademicSemesterOffered: canvasAssignmentRubricItemToInsert.canvasCourseAcademicSemesterOffered,
        canvasCourseAcademicYearOffered: canvasAssignmentRubricItemToInsert.canvasCourseAcademicYearOffered
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
            canvasRubricId: canvasAssignmentRubricItemToInsert.canvasRubricId,
            canvasCourseAcademicSemesterOffered: canvasAssignmentRubricItemToInsert.canvasCourseAcademicSemesterOffered,
            canvasCourseAcademicYearOffered: canvasAssignmentRubricItemToInsert.canvasCourseAcademicYearOffered
          }
        );
        console.assert(
          deleteOlderCanvasAssignmentRubricItemResult,
          "Error! The older assignment with rubric item did not get deleted properly!"
        );
      }

      const canvasAssignmentRubricItemInsertResult = await canvasAssignmentRubricItemToInsert.save();
      log.info("Inserted the specified assignment with rubric entry successfully! Congratulations!");
      userDashboardProgressEmitter.emit("progress", {
        progress: `[${academicYearAndSemesterFilterStr}] Inserted the specified assignment with rubric entry successfully! Congratulations!`
      });
    } catch (err) {
      log.error(
        "Error with the specified assignment with rubric entry and interacting the Canvas API! Please try again!"
      );
      userDashboardProgressEmitter.emit("progress", {
        progress: `[${academicYearAndSemesterFilterStr}] Error with the specified assignment with rubric entry and interacting the Canvas API! Please try again!`
      });

      process.exit(1);
    }
    log.info(`ASSIGNMENT WITH RUBRIC INDEX ${j} COMPLETED ------------------------------------- \n`);
    userDashboardProgressEmitter.emit("progress", {
      progress: `[${academicYearAndSemesterFilterStr}] ASSIGNMENT WITH RUBRIC INDEX ${j} COMPLETED ------------------------------------- \n`
    });
  }
  log.info("Inserted ALL of the specified assignment with rubric entries successfully! Congratulations!");
  userDashboardProgressEmitter.emit("progress", {
    progress: `[${academicYearAndSemesterFilterStr}] Inserted ALL of the specified assignment with rubric entries successfully! Congratulations!`
  });

  return true;
}

function convertCanvasQuizMapToArray(userId: number, inputMap: Map<CanvasCourseInfo, Array<CanvasQuizQuestionGroup>>) {
  const resultArray: CanvasCourseQuizMongoDBEntry[] = [];

  // Map: { { courseId, courseName, courseDept, courseNum }, Array <{ quizId, questioNames, [questions, [answers (optional)]] } }
  inputMap.forEach(
    (
      questionGroups,
      { courseId, courseName, courseDept, courseNum, courseAcademicSemesterOffered, courseAcademicYearOffered }
    ) => {
      questionGroups.forEach(({ quizId, quizName, quizDueAt, questions }) => {
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
          quizDueAt: quizDueAt,
          canvasCourseAcademicSemesterOffered: courseAcademicSemesterOffered,
          canvasCourseAcademicYearOffered: courseAcademicYearOffered,
          // Empty for now: Will be resolved later in front-end React Matching Component
          canvasMatchedLearningObjectivesArr: new Array<string[]>(quizEntries.length).fill([]) as string[][],
          canvasQuizEntries: quizEntries
        };
        resultArray.push(newQuizEntry);
      });
    }
  );

  return resultArray;
}

function convertAssignmentWithRubricArrToBeMongoDBCompliant(
  canvasUserId: number,
  assignmentRubricResultsArr: CanvasUserAssignmentWithRubricBase[]
): CanvasCourseAssignmentRubricObjBase[] {
  const newAssignmentRubricResultsArr: CanvasCourseAssignmentRubricObjBase[] = [];

  assignmentRubricResultsArr.forEach((assignmentRubricResult) => {
    console.assert(assignmentRubricResult.canvasCourseAssignmentRubricObjArr.length === 1);
    const assignmentRubricObjArrEntry = { ...assignmentRubricResult.canvasCourseAssignmentRubricObjArr[0] };

    const newAssignmentRubricResult: CanvasCourseAssignmentRubricObjBase = {
      canvasUserId: canvasUserId,
      canvasCourseAcademicSemesterOffered: assignmentRubricResult.canvasCourseAcademicSemesterOffered,
      canvasCourseAcademicYearOffered: assignmentRubricResult.canvasCourseAcademicYearOffered,
      canvasCourseInternalId: assignmentRubricResult.canvasCourseInternalId,
      canvasDeptAbbrev: assignmentRubricResult.canvasDeptAbbrev,
      canvasCourseNum: assignmentRubricResult.canvasCourseNum,
      canvasCourseName: assignmentRubricResult.canvasCourseName,
      canvasRubricId: assignmentRubricResult.canvasCourseAssignmentRubricId,
      canvasAssignmentId: assignmentRubricResult.canvasCourseAssignmentId,
      canvasAssignmentName: assignmentRubricResult.canvasCourseAssignmentName,
      canvasAssignmentDueAt: assignmentRubricResult.canvasCourseAssignmentDueAt,
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

router.get("/api/canvas/retrieveCanvasId/progress", (req, res) => {
  // Set appropriate headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Function to send keep-alive messages
  function sendKeepAlive() {
    return res.write(":\n\n"); // SSE comment to keep connection alive
  }

  // Send initial keep-alive message
  sendKeepAlive();

  // Interval to send keep-alive messages every 15 seconds
  const keepAliveInterval = setInterval(sendKeepAlive, 15000);

  // Listen for progress events
  function progressHandler(data: any) {
    return res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  userLoginProgressEmitter.on("progress", progressHandler);

  // Remove listener when the client closes the connection
  req.on("close", () => {
    userLoginProgressEmitter.off("progress", progressHandler);
    clearInterval(keepAliveInterval);
  });
});

router.get("/api/canvas/retrieveCanvasLearningObjectiveStatus/:canvasCourseInternalId", async (req, res) => {
  const canvasCourseInternalId = parseInt(req.params.canvasCourseInternalId);
  try {
    const listedCourseLearningObjectives = await CourseObjectivesModel.findOne({
      canvasCourseInternalId: canvasCourseInternalId
    });
    if (!listedCourseLearningObjectives) {
      throw new Error("The specified Canvas learning-objectives for this course do not exist in the MongoDB database");
    }
    log.info(listedCourseLearningObjectives.canvasObjectives);
    return res.status(200).send(JSON.stringify(listedCourseLearningObjectives.canvasObjectives));
  } catch (err) {
    log.error("Did not find any Canvas learning objective for that course! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "GET",
      errorMsg: "No items found in MongoDB database"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

router.put("/api/canvas/retrieveCanvasId/:canvasAccountId/:canvasUsername", async (req, res) => {
  const canvasAccountId = parseInt(req.params.canvasAccountId);
  const canvasUsername = req.params.canvasUsername as string;
  log.info(req.body);
  const { canvasUserApiKey } = req.body;
  log.info("Canvas Account ID:", canvasAccountId);
  log.info("Canvas Username:", canvasUsername);
  log.info("Canvas User API Key:", canvasUserApiKey);
  try {
    userLoginProgressEmitter.emit("progress", { progress: "Process started..." });
    const axiosHeaders: AxiosAuthHeaders = {
      Authorization: `Bearer ${canvasUserApiKey}`
    };

    // Canvas API O-Auth Fallback
    // Instructors (and above can only use this)
    userLoginProgressEmitter.emit("progress", { progress: `Looking up Canvas User ID...` });
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

    userLoginProgressEmitter.emit("progress", { progress: `Storing Canvas User credentials in MongoDB...` });
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

    userLoginProgressEmitter.emit("progress", { progress: "Process completed!" });
    return res.status(isNewUser ? 201 : 200).send(JSON.stringify({ UserId: canvasUserId })); // 201 = Successful Resource Creation
  } catch (err) {
    log.error("Error in storing Canvas user information in MongoDB database! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "PUT",
      errorMsg: "Failed to store Canvas user information the MongoDB database"
    };
    userLoginProgressEmitter.emit("progress", { progress: "Error: Process failed!" });
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

router.get("/api/canvas/retrieveCanvasData/progress", async (req, res) => {
  // Set appropriate headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Function to send keep-alive messages
  function sendKeepAlive() {
    return res.write(":\n\n"); // SSE comment to keep connection alive
  }

  // Send initial keep-alive message
  sendKeepAlive();

  // Interval to send keep-alive messages every 15 seconds
  const keepAliveInterval = setInterval(sendKeepAlive, 15000);

  // Listen for progress events
  function progressHandler(data: any) {
    return res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  userDashboardProgressEmitter.on("progress", progressHandler);

  // Remove listener when the client closes the connection
  req.on("close", () => {
    userDashboardProgressEmitter.off("progress", progressHandler);
    clearInterval(keepAliveInterval);
  });
});

router.patch("/api/canvas/:canvasUserId/:academicSemesterStr/:academicYearStr", async (req, res) => {
  try {
    const canvasUserId = parseInt(req.params.canvasUserId);
    const { academicSemesterStr, academicYearStr } = req.params;
    const academicSemester = academicSemesterStr as SeasonTypeEnumValues;
    const academicYear = parseInt(academicYearStr);
    userDashboardProgressEmitter.emit("progress", { progress: "Started Canvas API caching into MongoDB..." });
    const academicYearAndSemesterFilterStr = `${academicYear} ${academicSemester}` as const;
    log.trace(academicYearAndSemesterFilterStr);
    await loadCanvasDataFromExternalApiAndSaveIntoDB(canvasUserId, academicYear, academicSemester);
    userDashboardProgressEmitter.emit("progress", {
      progress: "Finished loading all entries from Canvas API into MongoDB..."
    });
    return res.status(200).send(
      JSON.stringify({
        message: `[${academicYearAndSemesterFilterStr}] Sucessfully parsed through the selected semester's Canvas course quizzes and assignments (with rubrics) data!`
      })
    );
  } catch (err) {
    log.error("Did not find parse the selected semester's Canvas information! Please try again!");
    const resErrBody: APIErrorResponse = {
      errorLoc: "PATCH",
      errorMsg: "Error in parsing the selected semester's Canvas information"
    };
    return res.status(400).send(JSON.stringify(resErrBody));
  }
});

let index = 0;
router.get("/api/canvas/quiz/:canvasUserId/:academicSemesterStr/:academicYearStr", async (req, res) => {
  try {
    const canvasUserId = parseInt(req.params.canvasUserId);
    log.warn(`Quiz Info Requested Canvas User ID: ${canvasUserId}`);
    const { academicSemesterStr, academicYearStr } = req.params;
    const academicSemester = academicSemesterStr as SeasonTypeEnumValues;
    const academicYear = parseInt(academicYearStr);
    const academicYearAndSemesterFilterStr = `${academicYear} ${academicSemester}` as const;
    log.trace(academicYearAndSemesterFilterStr);
    const currItems = await CanvasCourseQuizModel.find({
      canvasUserId: canvasUserId,
      canvasCourseAcademicSemesterOffered: academicSemester,
      canvasCourseAcademicYearOffered: academicYear
    });
    log.info(currItems);
    index++;
    log.info(`END OF QUIZ GET REQUEST #${index} (SEMESTER: ${academicYearAndSemesterFilterStr}) ---------------------`);
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
