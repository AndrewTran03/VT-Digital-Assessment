import { useState } from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import {
  CanvasCourseQuizMongoDBEntry,
  LearningObjectiveQuizData,
  CanvasCourseAssociations,
  CanvasUserInfoObj,
  CanvasQuizStatistic
} from "./shared/types";
import {
  CanvasQuizQuestionContext,
  LearningObjectiveContext,
  CanvasUserInfoContext,
  CanvasUserCourseNamesArrContext,
  CanvasQuizStatisticContext
} from "./shared/contexts";

const App: React.FC = () => {
  // Initial States of Each React-Context's Shared Data
  const [canvasQuizDataArr, setCanvasQuizDataArr] = useState<CanvasCourseQuizMongoDBEntry[]>([]);
  const [canvasLearningObjectiveData, setCanvasLearningObjectiveData] = useState<LearningObjectiveQuizData>({
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

  return (
    <CanvasQuizQuestionContext.Provider value={{ canvasQuizDataArr, setCanvasQuizDataArr }}>
      <LearningObjectiveContext.Provider value={{ canvasLearningObjectiveData, setCanvasLearningObjectiveData }}>
        <CanvasUserInfoContext.Provider value={{ canvasUserInfo, setCanvasUserInfo }}>
          <CanvasUserCourseNamesArrContext.Provider value={{ canvasUserCourseNamesArr, setCanvasUserCourseNamesArr }}>
            <CanvasQuizStatisticContext.Provider
              value={{ canvasQuizQuestionStatisticDataArr, setCanvasQuizQuestionStatisticDataArr }}
            >
              <AppRouter />
            </CanvasQuizStatisticContext.Provider>
          </CanvasUserCourseNamesArrContext.Provider>
        </CanvasUserInfoContext.Provider>
      </LearningObjectiveContext.Provider>
    </CanvasQuizQuestionContext.Provider>
  );
};

export default App;
