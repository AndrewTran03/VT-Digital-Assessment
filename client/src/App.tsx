import { useState } from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import {
  CanvasCourseQuizMongoDBEntry,
  LearningObjectiveQuizData,
  CanvasCourseAssociations,
  CanvasUserInfoObj,
  CanvasQuizStatistic,
  CanvasCourseAssignmentRubricObjMongoDBEntry,
  LearningObjectiveAssignmentWithRubricData
} from "./shared/types";
import {
  CanvasQuizQuestionContext,
  QuizLearningObjectiveContext,
  CanvasUserInfoContext,
  CanvasUserCourseNamesArrContext,
  CanvasQuizStatisticContext,
  CanvasAssignmentWithRubricContext,
  AssignmentWithRubricLearningObjectiveContext
} from "./shared/contexts";

const App: React.FC = () => {
  // Initial States of Each React-Context's Shared Data
  const [canvasQuizDataArr, setCanvasQuizDataArr] = useState<CanvasCourseQuizMongoDBEntry[]>([]);
  const [canvasQuizLearningObjectiveData, setCanvasQuizLearningObjectiveData] = useState<LearningObjectiveQuizData>({
    canvasCourseInternalId: 0,
    quizId: 0
  });
  const [canvasUserInfo, setCanvasUserInfo] = useState<CanvasUserInfoObj>({
    canvasUserId: 0
  });
  const [canvasUserCourseNamesArr, setCanvasUserCourseNamesArr] = useState<CanvasCourseAssociations[]>([]);
  const [canvasQuizQuestionStatisticDataArr, setCanvasQuizQuestionStatisticDataArr] = useState<CanvasQuizStatistic[]>(
    []
  );
  const [assignmentWithRubricDataArr, setAssignmentWithRubricDataArr] = useState<
    CanvasCourseAssignmentRubricObjMongoDBEntry[]
  >([]);
  const [canvasAssignmentWithRubricLearningObjectiveData, setCanvasAssignmentWithRubricLearningObjectiveData] =
    useState<LearningObjectiveAssignmentWithRubricData>({
      canvasCourseInternalId: 0,
      rubricId: 0
    });

  return (
    <CanvasQuizQuestionContext.Provider value={{ canvasQuizDataArr, setCanvasQuizDataArr }}>
      <QuizLearningObjectiveContext.Provider
        value={{ canvasQuizLearningObjectiveData, setCanvasQuizLearningObjectiveData }}
      >
        <CanvasUserInfoContext.Provider value={{ canvasUserInfo, setCanvasUserInfo }}>
          <CanvasUserCourseNamesArrContext.Provider value={{ canvasUserCourseNamesArr, setCanvasUserCourseNamesArr }}>
            <CanvasQuizStatisticContext.Provider
              value={{ canvasQuizQuestionStatisticDataArr, setCanvasQuizQuestionStatisticDataArr }}
            >
              <CanvasAssignmentWithRubricContext.Provider
                value={{ assignmentWithRubricDataArr, setAssignmentWithRubricDataArr }}
              >
                <AssignmentWithRubricLearningObjectiveContext.Provider
                  value={{
                    canvasAssignmentWithRubricLearningObjectiveData,
                    setCanvasAssignmentWithRubricLearningObjectiveData
                  }}
                ></AssignmentWithRubricLearningObjectiveContext.Provider>
                <AppRouter />
              </CanvasAssignmentWithRubricContext.Provider>
            </CanvasQuizStatisticContext.Provider>
          </CanvasUserCourseNamesArrContext.Provider>
        </CanvasUserInfoContext.Provider>
      </QuizLearningObjectiveContext.Provider>
    </CanvasQuizQuestionContext.Provider>
  );
};

export default App;
