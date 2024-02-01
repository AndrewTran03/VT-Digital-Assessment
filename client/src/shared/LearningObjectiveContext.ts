import React from "react";
import { CourseObjectives } from "../assets/types";

type LearningObjectiveType = {
  courseLearningObjectiveData: CourseObjectives;
  setLearningCourseObjectiveData: React.Dispatch<React.SetStateAction<CourseObjectives>>;
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
