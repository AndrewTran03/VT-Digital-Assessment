import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { FileUploader } from "react-drag-drop-files";
import { backendUrlBase, APIErrorResponse, SeasonEnumValues, SingleCanvasLearningObjective } from "../shared/types";
import { APIRequestError } from "../shared/APIRequestError";
import "../styles/DragDropFileImport.css";

const seasonValues = ["Fall", "Spring", "Summer", "Winter"] as const;
const learningObjSchema = z.object({
  deptAbbrev: z.string().min(2).max(4),
  courseNum: z.number().min(1000).max(9999),
  semester: z.enum(seasonValues),
  year: z.number().gte(0).lte(9999),
  canvasCourseInternalId: z.number().gte(100000),
  canvasObjective: z.string().min(1)
});

/*
Two Step Import:
(1) Select Course from Dropdown
(2) Second Screen will show the existing course objectives
  - Have import button (take in a CSV file) to add more
*/
// function FileImport(): ReturnType<React.FC> { // Another way to return React FC components
const FileImport: React.FC = () => {
  const [learningObjArr, setLearningObjArr] = useState<SingleCanvasLearningObjective[]>([]);
  const [allowedToSubmit, setAllowedToSubmit] = useState(false);
  const navigate = useNavigate();
  const acceptableFileTypes = ["CSV"];

  useEffect(() => {
    console.log(learningObjArr);
  }, [learningObjArr]);

  function handleFileChange(file: File) {
    console.log(file.name);
    const reader = new FileReader();
    // Reset the array back to avoid learning-objective upload mismatch
    // with consecutive submissions
    setLearningObjArr([]);
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const fileContents = e.target?.result as string;
      const lines = fileContents.split("\n"); // Line Delimited
      lines.forEach((line, idx) => {
        if (idx == 0) {
          // Skip first line (descriptive headers)
          return;
        }
        const entries = line.split(","); // Since this is a CSV file
        const [deptAbbrev, courseNumStr, semesterStr, yearStr, canvasCourseInternalIdStr, ...canvasObjectiveUnparsed] =
          entries;

        const courseNum = parseInt(courseNumStr);
        const semester = semesterStr as SeasonEnumValues;
        const year = parseInt(yearStr);
        const canvasCourseInternalId = parseInt(canvasCourseInternalIdStr);
        const canvasObjective = canvasObjectiveUnparsed.join(",").replace('".\r\n', "");

        const newLearningObjective: SingleCanvasLearningObjective = {
          deptAbbrev,
          courseNum,
          semester,
          year,
          canvasCourseInternalId,
          canvasObjective
        };
        const validResult = learningObjSchema.safeParse(newLearningObjective);
        if (validResult.success) {
          setLearningObjArr((prevArr) => prevArr.concat(newLearningObjective));
          setAllowedToSubmit(true);
        } else {
          console.error(fromZodError(validResult.error));
          setAllowedToSubmit(false);
        }
      });
    };
    reader.readAsText(file);
  }

  async function handleButtonSubmit(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Hit submitted!");

    await axios
      .post(`${backendUrlBase}/api/objective`, learningObjArr)
      .then((res) => console.log(res))
      .catch((err: AxiosError) => {
        const errorConfig = err.response?.data as APIErrorResponse;
        const error = new APIRequestError("Failed to INSERT course objectives to backend", errorConfig);
        console.error(error.toString());
      });
  }

  function handleBackButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Refresh button pressed!");
    navigate("/");
  }

  return (
    <>
      <button type="reset" onClick={handleBackButtonClick}>
        Back
      </button>
      <button type="submit" disabled={!allowedToSubmit} onClick={handleButtonSubmit}>
        Submit
      </button>
      {/* Reference: https://www.npmjs.com/package/react-drag-drop-files?activeTab=readme */}
      <FileUploader
        multiple={false}
        label={"Upload Additional Learning Objectives Here"}
        required={true}
        disabled={false}
        types={acceptableFileTypes}
        hoverTitle={"Drop here"}
        handleChange={handleFileChange}
        classes={"file-uploader"}
        onDraggingStateChange={(dragging: boolean) => console.log(dragging)}
        dropMessageStyle={{ backgroundColor: "green", color: "black" }}
        onDrop={(file: File) => console.log(`FILE DROPPED: ${file.name}`)}
        onTypeError={(err: Error) => console.error(err.message)}
      />
    </>
  );
};

export default FileImport;
