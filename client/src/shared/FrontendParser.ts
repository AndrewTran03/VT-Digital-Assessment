/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  dateLike,
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  QuestionTypeEnumValues,
  SeasonEnumValues,
  CanvasCourseAssignmentRubricObjMongoDBEntry,
  CanvasCourseItemMongoDBEntry
} from "./types";

function parseCanvasQuizQuestionMongoDBDCollection(quizData: any[]): CanvasCourseQuizMongoDBEntry[] {
  const canvasEntriesArr: CanvasCourseQuizMongoDBEntry[] = [];
  quizData.forEach((data: any) => {
    const _id = data._id;
    const __v = data.__v as number;
    const createdDate = data.created_date;
    const updatedDate = data.updated_date;
    const canvasUserId = data.canvasUserId as number;
    const canvasCourseInternalId = data.canvasCourseInternalId as number;
    const canvasCourseName = data.canvasCourseName;
    const canvasCourseDept = data.canvasCourseDept;
    const canvasCourseNum = data.canvasCourseNum as number;
    const canvasCourseAcademicSemesterOffered = data.canvasCourseAcademicSemesterOffered as SeasonEnumValues;
    const canvasCourseAcademicYearOffered = data.canvasCourseAcademicYearOffered as number;
    const quizId = data.quizId as number;
    const quizName = data.quizName;
    const quizDueAt = data.quizDueAt as dateLike;
    const canvasMatchedLearningObjectivesArr: string[][] = [];
    data.canvasMatchedLearningObjectivesArr.forEach((learningObjectiveQuesArr: any) => {
      const currLearningObjectiveQuesArr = learningObjectiveQuesArr as string[];
      canvasMatchedLearningObjectivesArr.push(currLearningObjectiveQuesArr);
    });
    const canvasQuizEntries: CanvasCourseQuizQuestionMongoDBEntry[] = [];
    data.canvasQuizEntries.forEach((canvasQuizEntry: any) => {
      const _id = canvasQuizEntry._id;
      const questionType = canvasQuizEntry.questionType as QuestionTypeEnumValues;
      const questionText = canvasQuizEntry.questionText;
      const answers: CanvasCourseMCQAnswerMongoDBEntry[] = [];
      if (canvasQuizEntry.answers) {
        canvasQuizEntry.answers.forEach((canvasQuizAnswer: any) => {
          const _id = canvasQuizAnswer._id;
          const weight = canvasQuizAnswer.weight as number;
          const migration_id = canvasQuizAnswer.migration_id;
          const id = canvasQuizAnswer.id as number;
          const text = canvasQuizAnswer.text;

          const currCanvasQuizAnswerEntry: CanvasCourseMCQAnswerMongoDBEntry = {
            _id: _id,
            weight: weight,
            migration_id: migration_id,
            id: id,
            text: text
          };
          answers.push(currCanvasQuizAnswerEntry);
        });
      }

      const currCanvasQuizEntry: CanvasCourseQuizQuestionMongoDBEntry = {
        _id: _id,
        questionType: questionType,
        questionText: questionText,
        answers: answers
      };
      canvasQuizEntries.push(currCanvasQuizEntry);
    });

    const currCourseQuizEntry: CanvasCourseQuizMongoDBEntry = {
      _id: _id,
      __v: __v,
      createdDate: createdDate,
      updatedDate: updatedDate,
      canvasUserId: canvasUserId,
      canvasCourseInternalId: canvasCourseInternalId,
      canvasCourseName: canvasCourseName,
      canvasCourseDept: canvasCourseDept,
      canvasCourseNum: canvasCourseNum,
      canvasCourseAcademicSemesterOffered: canvasCourseAcademicSemesterOffered,
      canvasCourseAcademicYearOffered: canvasCourseAcademicYearOffered,
      quizId: quizId,
      quizName: quizName,
      quizDueAt: quizDueAt,
      canvasMatchedLearningObjectivesArr: canvasMatchedLearningObjectivesArr,
      canvasQuizEntries: canvasQuizEntries
    };
    canvasEntriesArr.push(currCourseQuizEntry);
  });

  return canvasEntriesArr;
}

function mergeCanvasQuizAndAssignmentRubricDBCollectionArr(
  quizData: CanvasCourseQuizMongoDBEntry[],
  assignmentWithRubricData: CanvasCourseAssignmentRubricObjMongoDBEntry[]
) {
  const mergedCanvasQuizAndAssignmentRubricData: CanvasCourseItemMongoDBEntry[] = [];

  quizData.forEach((quizEntry) => {
    const itemId = quizEntry.quizId;
    const itemName = quizEntry.quizName;

    let itemDueAt: dateLike = null;
    if (typeof quizEntry.quizDueAt === "string") {
      itemDueAt = new Date(quizEntry.quizDueAt);
    } else {
      itemDueAt = quizEntry.quizDueAt;
    }

    const canvasUserId = quizEntry.canvasUserId;
    const canvasCourseInternalId = quizEntry.canvasCourseInternalId;
    const canvasCourseName = quizEntry.canvasCourseName;
    const canvasCourseDept = quizEntry.canvasCourseDept;
    const canvasCourseNum = quizEntry.canvasCourseNum;
    const canvasCourseAcademicSemesterOffered = quizEntry.canvasCourseAcademicSemesterOffered;
    const canvasCourseAcademicYearOffered = quizEntry.canvasCourseAcademicYearOffered;
    const canvasMatchedLearningObjectivesArr = quizEntry.canvasMatchedLearningObjectivesArr;
    const canvasNumberItems = quizEntry.canvasMatchedLearningObjectivesArr.length;

    const currMergedQuizEntry: CanvasCourseItemMongoDBEntry = {
      canvasUserId: canvasUserId,
      canvasCourseInternalId: canvasCourseInternalId,
      canvasCourseName: canvasCourseName,
      canvasCourseDept: canvasCourseDept,
      canvasCourseNum: canvasCourseNum,
      canvasCourseAcademicSemesterOffered: canvasCourseAcademicSemesterOffered,
      canvasCourseAcademicYearOffered: canvasCourseAcademicYearOffered,
      canvasItemId: itemId,
      canvasItenName: itemName,
      canvasCourseItemDueAt: itemDueAt,
      canvasMatchedLearningObjectivesArr: canvasMatchedLearningObjectivesArr,
      canvasNumberItems: canvasNumberItems,
      canvasItemType: "Assessment (Quiz/Test)"
    };
    mergedCanvasQuizAndAssignmentRubricData.push(currMergedQuizEntry);
  });

  assignmentWithRubricData.forEach((assignmentEntry) => {
    const itemId = assignmentEntry.canvasAssignmentId;
    const rubricId = assignmentEntry.canvasRubricId;
    const itemName = assignmentEntry.canvasAssignmentName;

    let itemDueAt: dateLike = null;
    if (typeof assignmentEntry.canvasAssignmentDueAt === "string") {
      itemDueAt = new Date(assignmentEntry.canvasAssignmentDueAt);
    } else {
      itemDueAt = assignmentEntry.canvasAssignmentDueAt;
    }

    const canvasUserId = assignmentEntry.canvasUserId;
    const canvasCourseInternalId = assignmentEntry.canvasCourseInternalId;
    const canvasCourseName = assignmentEntry.canvasCourseName;
    const canvasCourseDept = assignmentEntry.canvasDeptAbbrev;
    const canvasCourseNum = assignmentEntry.canvasCourseNum;
    const canvasCourseAcademicSemesterOffered = assignmentEntry.canvasCourseAcademicSemesterOffered;
    const canvasCourseAcademicYearOffered = assignmentEntry.canvasCourseAcademicYearOffered;
    const canvasMatchedLearningObjectivesArr = assignmentEntry.canvasMatchedLearningObjectivesArr;
    const canvasNumberItems = assignmentEntry.canvasMatchedLearningObjectivesArr.length;

    const currMergedAssignmentEntry: CanvasCourseItemMongoDBEntry = {
      canvasUserId: canvasUserId,
      canvasCourseInternalId: canvasCourseInternalId,
      canvasCourseName: canvasCourseName,
      canvasCourseDept: canvasCourseDept,
      canvasCourseNum: canvasCourseNum,
      canvasCourseAcademicSemesterOffered: canvasCourseAcademicSemesterOffered,
      canvasCourseAcademicYearOffered: canvasCourseAcademicYearOffered,
      canvasItemId: itemId,
      canvasAssignmentRubricId: rubricId,
      canvasItenName: itemName,
      canvasCourseItemDueAt: itemDueAt,
      canvasMatchedLearningObjectivesArr: canvasMatchedLearningObjectivesArr,
      canvasNumberItems: canvasNumberItems,
      canvasItemType: "Assignment (with Rubric)"
    };
    mergedCanvasQuizAndAssignmentRubricData.push(currMergedAssignmentEntry);
  });
  return mergedCanvasQuizAndAssignmentRubricData;
}

function determineUniqueSetOfCanvasCourseArrForTermandYear(
  quizData: CanvasCourseQuizMongoDBEntry[],
  assignmentWithRubricData: CanvasCourseAssignmentRubricObjMongoDBEntry[]
) {
  const canvasCourseTermUniqueSet: string[] = [];

  for (const { canvasCourseName } of quizData) {
    if (!canvasCourseTermUniqueSet.includes(canvasCourseName)) {
      canvasCourseTermUniqueSet.push(canvasCourseName);
    }
  }

  for (const { canvasCourseName } of assignmentWithRubricData) {
    if (!canvasCourseTermUniqueSet.includes(canvasCourseName)) {
      canvasCourseTermUniqueSet.push(canvasCourseName);
    }
  }

  return canvasCourseTermUniqueSet;
}

export {
  parseCanvasQuizQuestionMongoDBDCollection,
  mergeCanvasQuizAndAssignmentRubricDBCollectionArr,
  determineUniqueSetOfCanvasCourseArrForTermandYear
};
