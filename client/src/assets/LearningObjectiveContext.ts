import React from "react";

type CreateCanvasQuizQuestionType = {
  data: string;
  setData: React.Dispatch<React.SetStateAction<string>>;
};

const LearningObjectiveContext = React.createContext<CreateCanvasQuizQuestionType>({ data: "", setData: () => {} });

export default LearningObjectiveContext;
