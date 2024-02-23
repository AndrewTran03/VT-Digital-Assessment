import React from "react";
import { CanvasQuizStatistic } from "../types";

type CanvasQuizStatisticType = {
  canvasQuizQuestionStatisticDataArr: CanvasQuizStatistic[];
  setCanvasQuizQuestionStatisticDataArr: React.Dispatch<React.SetStateAction<CanvasQuizStatistic[]>>;
};

const CanvasQuizStatisticContext = React.createContext<CanvasQuizStatisticType>({
  canvasQuizQuestionStatisticDataArr: [],
  setCanvasQuizQuestionStatisticDataArr: () => {}
});

export default CanvasQuizStatisticContext;
