import React from "react";
import { LearningObjectiveQuizData } from "../types";

type LearningObjectiveType = {
  canvasLearningObjectiveData: LearningObjectiveQuizData;
  setCanvasLearningObjectiveData: React.Dispatch<React.SetStateAction<LearningObjectiveQuizData>>;
};

const LearningObjectiveContext = React.createContext<LearningObjectiveType>({
  canvasLearningObjectiveData: {
    canvasCourseInternalId: 0,
    quizId: 0
  },
  setCanvasLearningObjectiveData: () => {}
});

export default LearningObjectiveContext;
