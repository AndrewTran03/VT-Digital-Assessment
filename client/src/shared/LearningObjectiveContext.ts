import React from "react";
import { CanvasLearningObjectives } from "../assets/types";

type LearningObjectiveType = {
  courseLearningObjectiveData: CanvasLearningObjectives;
  setLearningCourseObjectiveData: React.Dispatch<React.SetStateAction<CanvasLearningObjectives>>;
};

const LearningObjectiveContext = React.createContext<LearningObjectiveType>({
  courseLearningObjectiveData: {
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
  },
  setLearningCourseObjectiveData: () => {}
});

export default LearningObjectiveContext;
