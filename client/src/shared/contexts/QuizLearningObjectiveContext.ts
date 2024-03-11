import React from "react";
import { LearningObjectiveQuizData } from "../types";

type QuizLearningObjectiveType = {
  canvasQuizLearningObjectiveData: LearningObjectiveQuizData;
  setCanvasQuizLearningObjectiveData: React.Dispatch<React.SetStateAction<LearningObjectiveQuizData>>;
};

const QuizLearningObjectiveContext = React.createContext<QuizLearningObjectiveType>({
  canvasQuizLearningObjectiveData: {
    canvasCourseInternalId: 0,
    quizId: 0
  },
  setCanvasQuizLearningObjectiveData: () => {}
});

export default QuizLearningObjectiveContext;
