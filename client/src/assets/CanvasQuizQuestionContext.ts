import React from "react";

type LearningObjectiveType = {
  data: string;
  setData: React.Dispatch<React.SetStateAction<string>>;
};

const CanvasQuizQuestionContext = React.createContext<LearningObjectiveType>({ data: "", setData: () => {} });

export default CanvasQuizQuestionContext;
