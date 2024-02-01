import { useState } from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import { CourseObjectives, CanvasCourseQuizMongoDBEntry } from "./assets/types";
import { CanvasQuizQuestionContext, LearningObjectiveContext } from "./shared";

const App: React.FC = () => {
  // Initial States of Each React-Context's Shared Data
  const [canvasQuizDataArr, setCanvasQuizDataArr] = useState<CanvasCourseQuizMongoDBEntry[]>([]);
  const [courseLearningObjectiveData, setLearningCourseObjectiveData] = useState<CourseObjectives>({
    _id: "",
    __v: 0,
    createdDate: "",
    updatedDate: "",
    deptAbbrev: "",
    courseNum: 0,
    semester: "Summer",
    year: 0,
    canvasCourseInternalId: 0,
    canvasObjectives: []
  });

  return (
    <CanvasQuizQuestionContext.Provider value={{ canvasQuizDataArr, setCanvasQuizDataArr }}>
      <LearningObjectiveContext.Provider value={{ courseLearningObjectiveData, setLearningCourseObjectiveData }}>
        <AppRouter />
      </LearningObjectiveContext.Provider>
    </CanvasQuizQuestionContext.Provider>
  );
};

export default App;
