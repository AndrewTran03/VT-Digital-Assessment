/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  QuestionTypeEnumValues
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
    const quizId = data.quizId as number;
    const quizName = data.quizName;
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
      quizId: quizId,
      quizName: quizName,
      canvasMatchedLearningObjectivesArr: canvasMatchedLearningObjectivesArr,
      canvasQuizEntries: canvasQuizEntries
    };
    canvasEntriesArr.push(currCourseQuizEntry);
  });

  return canvasEntriesArr;
}

export { parseCanvasQuizQuestionMongoDBDCollection };
