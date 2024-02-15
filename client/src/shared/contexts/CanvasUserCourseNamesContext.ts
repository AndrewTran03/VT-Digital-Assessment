import React from "react";
import { CanvasCourseAssociations } from "../types";

type CanvasUserCourseNameArrType = {
  canvasUserCourseNamesArr: CanvasCourseAssociations[];
  setCanvasUserCourseNamesArr: React.Dispatch<React.SetStateAction<CanvasCourseAssociations[]>>;
};

const CanvasUserCourseNamesArrContext = React.createContext<CanvasUserCourseNameArrType>({
  canvasUserCourseNamesArr: [],
  setCanvasUserCourseNamesArr: () => {}
});

export default CanvasUserCourseNamesArrContext;
