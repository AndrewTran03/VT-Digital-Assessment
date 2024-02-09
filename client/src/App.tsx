import { useState } from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import { CanvasCourseQuizMongoDBEntry, LearningObjectiveQuizData } from "./shared/types";
import { CanvasQuizQuestionContext, LearningObjectiveContext } from "./shared";

const App: React.FC = () => {
  // Initial States of Each React-Context's Shared Data
  const [canvasQuizDataArr, setCanvasQuizDataArr] = useState<CanvasCourseQuizMongoDBEntry[]>([]);
  const [canvasLearningObjectiveData, setCanvasLearningObjectiveData] = useState<LearningObjectiveQuizData>({
    canvasCourseInternalId: 0,
    quizId: 0
  });

  return (
    <CanvasQuizQuestionContext.Provider value={{ canvasQuizDataArr, setCanvasQuizDataArr }}>
      <LearningObjectiveContext.Provider value={{ canvasLearningObjectiveData, setCanvasLearningObjectiveData }}>
        <AppRouter />
      </LearningObjectiveContext.Provider>
    </CanvasQuizQuestionContext.Provider>
  );
};

export default App;
