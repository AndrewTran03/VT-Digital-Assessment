import { useState } from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import {
  CanvasCourseQuizMongoDBEntry,
  LearningObjectiveQuizData,
  CanvasCourseAssociations,
  CanvasUserInfoObj
} from "./shared/types";
import { CanvasQuizQuestionContext, LearningObjectiveContext, CanvasUserInfoContext } from "./shared/contexts";
import CanvasUserCourseNamesContext from "./shared/contexts/CanvasUserCourseNamesContext";

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

  return (
    <CanvasQuizQuestionContext.Provider value={{ canvasQuizDataArr, setCanvasQuizDataArr }}>
      <LearningObjectiveContext.Provider value={{ canvasLearningObjectiveData, setCanvasLearningObjectiveData }}>
        <CanvasUserInfoContext.Provider value={{ canvasUserInfo, setCanvasUserInfo }}>
          <CanvasUserCourseNamesContext.Provider value={{ canvasUserCourseNamesArr, setCanvasUserCourseNamesArr }}>
            <AppRouter />
          </CanvasUserCourseNamesContext.Provider>
        </CanvasUserInfoContext.Provider>
      </LearningObjectiveContext.Provider>
    </CanvasQuizQuestionContext.Provider>
  );
};

export default App;
