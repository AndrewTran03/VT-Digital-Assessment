import { useState } from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import { CanvasCourseQuizMongoDBEntry, LearningObjectiveQuizData, CanvasCourseAssociations } from "./shared/types";
import { CanvasQuizQuestionContext, LearningObjectiveContext, CanvasUserIdContext } from "./shared/contexts";
import CanvasUserCourseNamesContext from "./shared/contexts/CanvasUserCourseNamesContext";

const App: React.FC = () => {
  // Initial States of Each React-Context's Shared Data
  const [canvasQuizDataArr, setCanvasQuizDataArr] = useState<CanvasCourseQuizMongoDBEntry[]>([]);
  const [canvasLearningObjectiveData, setCanvasLearningObjectiveData] = useState<LearningObjectiveQuizData>({
    canvasCourseInternalId: 0,
    quizId: 0
  });
  const [canvasUserId, setCanvasUserId] = useState(0);
  const [canvasUserCourseNamesArr, setCanvasUserCourseNamesArr] = useState<CanvasCourseAssociations[]>([]);

  return (
    <CanvasQuizQuestionContext.Provider value={{ canvasQuizDataArr, setCanvasQuizDataArr }}>
      <LearningObjectiveContext.Provider value={{ canvasLearningObjectiveData, setCanvasLearningObjectiveData }}>
        <CanvasUserIdContext.Provider value={{ canvasUserId, setCanvasUserId }}>
          <CanvasUserCourseNamesContext.Provider value={{ canvasUserCourseNamesArr, setCanvasUserCourseNamesArr }}>
            <AppRouter />
          </CanvasUserCourseNamesContext.Provider>
        </CanvasUserIdContext.Provider>
      </LearningObjectiveContext.Provider>
    </CanvasQuizQuestionContext.Provider>
  );
};

export default App;
