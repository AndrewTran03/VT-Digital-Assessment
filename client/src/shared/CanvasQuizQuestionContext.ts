import React from "react";
import { CanvasCourseQuizMongoDBEntry } from "../assets/types";

type CanvasQuizQuestionType = {
  canvasQuizDataArr: CanvasCourseQuizMongoDBEntry[];
  setCanvasQuizDataArr: React.Dispatch<React.SetStateAction<CanvasCourseQuizMongoDBEntry[]>>;
};

const CanvasQuizQuestionContext = React.createContext<CanvasQuizQuestionType>({
  canvasQuizDataArr: [],
  setCanvasQuizDataArr: () => {}
});

export default CanvasQuizQuestionContext;
