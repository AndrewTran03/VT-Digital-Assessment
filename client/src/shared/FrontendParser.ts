import {
  CanvasCourseMCQAnswerMongoDBEntry,
  CanvasCourseQuizMongoDBEntry,
  CanvasCourseQuizQuestionMongoDBEntry,
  CanvasLearningObjectives,
  QuestionTypeEnumValues,
  SeasonEnumValues
} from "../assets/types";

function parseCanvasQuizQuestionMongoDBDCollection(quizData: any[]) {
  const canvasEntriesArr: CanvasCourseQuizMongoDBEntry[] = [];
  quizData.forEach((data: any) => {
    const _id = data._id;
    const __v = data.__v as number;
    const createdDate = data.created_date;
    const updatedDate = data.updated_date;
    const canvasUserId = data.canvasUserId as number;
    const canvasCourseInternalId = data.canvasCourseInternalId as number;
    const quizId = data.quizId as number;
    const canvasMatchedLearningObjectivesArr: string[] = [];
    data.canvasMatchedLearningObjectivesArr.forEach((learningObjective: any) => {
      const currLearningObjective = learningObjective as string;
      canvasMatchedLearningObjectivesArr.push(currLearningObjective);
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
      quizId: quizId,
      canvasMatchedLearningObjectivesArr: canvasMatchedLearningObjectivesArr,
      canvasQuizEntries: canvasQuizEntries
    };
    canvasEntriesArr.push(currCourseQuizEntry);
  });

  return canvasEntriesArr;
}

function parseLearningObjectiveMongoDBDCollection(data: any) {
  const _id = data._id;
  const __v = data.__v as number;
  const createdDate = data.created_date;
  const updatedDate = data.updated_date;
  const deptAbbrev = data.deptAbbrev;
  const courseNum = data.courseNum as number;
  const semester = data.semester as SeasonEnumValues;
  const year = data.year;
  const canvasCourseInternalId = data.canvasCourseInternalId as number;
  const canvasObjectives: string[] = [];
  data.canvasObjectives.forEach((canvasObjective: any) => {
    const currLearningObjective = canvasObjective as string;
    canvasObjectives.push(currLearningObjective);
  });

  const learningObjectives: CanvasLearningObjectives = {
    _id: _id,
    __v: __v,
    createdDate: createdDate,
    updatedDate: updatedDate,
    deptAbbrev: deptAbbrev,
    courseNum: courseNum,
    semester: semester,
    year: year,
    canvasCourseInternalId: canvasCourseInternalId,
    canvasObjectives: canvasObjectives
  };

  return learningObjectives;
}

export { parseCanvasQuizQuestionMongoDBDCollection, parseLearningObjectiveMongoDBDCollection };
