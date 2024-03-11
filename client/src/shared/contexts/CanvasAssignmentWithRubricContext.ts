import React from "react";
import { CanvasCourseAssignmentRubricObjMongoDBEntry } from "../types";

type CanvasAssignmentWithRubricType = {
  assignmentWithRubricDataArr: CanvasCourseAssignmentRubricObjMongoDBEntry[];
  setAssignmentWithRubricDataArr: React.Dispatch<React.SetStateAction<CanvasCourseAssignmentRubricObjMongoDBEntry[]>>;
};

const CanvasAssignmentWithRubricContext = React.createContext<CanvasAssignmentWithRubricType>({
  assignmentWithRubricDataArr: [],
  setAssignmentWithRubricDataArr: () => {}
});

export default CanvasAssignmentWithRubricContext;
