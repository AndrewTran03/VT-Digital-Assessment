import React from "react";
import { LearningObjectiveAssignmentWithRubricData } from "../types";

type AssignmentWithRubricLearningObjectiveType = {
  canvasAssignmentWithRubricLearningObjectiveData: LearningObjectiveAssignmentWithRubricData;
  setCanvasAssignmentWithRubricLearningObjectiveData: React.Dispatch<
    React.SetStateAction<LearningObjectiveAssignmentWithRubricData>
  >;
};

const AssignmentWithRubricLearningObjectiveContext = React.createContext<AssignmentWithRubricLearningObjectiveType>({
  canvasAssignmentWithRubricLearningObjectiveData: {
    canvasCourseInternalId: 0,
    rubricId: 0
  },
  setCanvasAssignmentWithRubricLearningObjectiveData: () => {}
});

export default AssignmentWithRubricLearningObjectiveContext;
